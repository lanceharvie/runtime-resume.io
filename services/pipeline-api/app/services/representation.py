from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.domain import Candidate
from app.models.domain import Order
from app.schemas.auth import RepresentationPromptResponse
from app.services.candidates import CandidateService
from app.services.email import EmailService
from app.time import utc_now


class RepresentationService:
    def _get_order_and_candidate(self, session: Session, session_id: str) -> tuple[Order | None, Candidate | None]:
        order = session.query(Order).filter(Order.session_id == session_id).one_or_none()
        candidate = session.query(Candidate).filter(Candidate.order_session_id == session_id).one_or_none()
        return order, candidate

    def get_prompt(self, session: Session, session_id: str) -> RepresentationPromptResponse:
        order, candidate = self._get_order_and_candidate(session, session_id)
        if order is None or candidate is None:
            raise ValueError("Candidate pipeline record not found for this order")

        now = utc_now()
        eligible = bool(order.delivered_at and order.representation_prompt_status in {"eligible", "accepted", "declined"})
        if eligible and order.representation_prompted_at is None:
            order.representation_prompted_at = now
            order.updated_at = now
            session.flush()

        return RepresentationPromptResponse(
            ok=True,
            session_id=session_id,
            candidate_id=candidate.id,
            eligible=eligible,
            representation_prompt_status=order.representation_prompt_status,
            representation_prompted_at=order.representation_prompted_at.isoformat() if order.representation_prompted_at else None,
            delivered_at=order.delivered_at.isoformat() if order.delivered_at else None,
            open_to_representation=bool(candidate.open_to_representation),
            welcome_email_status=None,
        )

    def record_decision(self, session: Session, session_id: str, decision: str) -> RepresentationPromptResponse:
        normalized = (decision or "").strip().lower()
        if normalized not in {"accept", "decline"}:
            raise ValueError("Decision must be 'accept' or 'decline'")

        order, candidate = self._get_order_and_candidate(session, session_id)
        if order is None or candidate is None:
            raise ValueError("Candidate pipeline record not found for this order")
        if not order.delivered_at:
            raise ValueError("Representation prompt is only available after delivery")

        now = utc_now()
        welcome_email_status = "not_sent"

        if order.representation_prompted_at is None:
            order.representation_prompted_at = now

        if normalized == "accept":
            already_accepted = order.representation_prompt_status == "accepted"
            candidate.open_to_representation = True
            order.representation_prompt_status = "accepted"
            order.updated_at = now
            candidate.updated_at = now
            CandidateService().sync_candidate(session, candidate)
            if already_accepted:
                welcome_email_status = "already_sent"
            else:
                welcome_email_status = EmailService().send_representation_welcome_email(
                    session,
                    get_settings(),
                    candidate,
                )["delivery_mode"]
        else:
            candidate.open_to_representation = False
            order.representation_prompt_status = "declined"
            order.updated_at = now
            candidate.updated_at = now
            CandidateService().sync_candidate(session, candidate)
            welcome_email_status = "not_applicable"

        session.flush()
        return RepresentationPromptResponse(
            ok=True,
            session_id=session_id,
            candidate_id=candidate.id,
            eligible=True,
            representation_prompt_status=order.representation_prompt_status,
            representation_prompted_at=order.representation_prompted_at.isoformat() if order.representation_prompted_at else None,
            delivered_at=order.delivered_at.isoformat() if order.delivered_at else None,
            open_to_representation=bool(candidate.open_to_representation),
            welcome_email_status=welcome_email_status,
        )
