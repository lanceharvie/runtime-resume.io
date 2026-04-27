from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.domain import Candidate
from app.models.domain import NotificationSent
from app.models.domain import RoleNotification
from app.services.email import EmailService
from app.services.opencats import OpenCATSService
from app.time import ensure_utc
from app.time import utc_now


class NotificationService:
    def recently_notified(
        self,
        session: Session,
        candidate_id: int,
        notification_type: str,
        job_id: str | None = None,
    ) -> bool:
        query = (
            session.query(NotificationSent)
            .filter(NotificationSent.candidate_id == candidate_id)
            .filter(NotificationSent.notification_type == notification_type)
        )
        if job_id:
            query = query.filter(NotificationSent.job_id == job_id)

        row = query.order_by(NotificationSent.sent_at.desc(), NotificationSent.id.desc()).first()
        if row is None:
            return False
        cutoff_days = max(get_settings().notification_rate_limit_days, 0)
        if cutoff_days == 0:
            return True
        sent_at = ensure_utc(row.sent_at)
        if sent_at is None:
            return False
        return (utc_now() - sent_at).days < cutoff_days

    def list_candidate_notifications(self, session: Session, candidate: Candidate) -> list[dict]:
        rows = (
            session.query(RoleNotification, NotificationSent)
            .outerjoin(
                NotificationSent,
                (NotificationSent.candidate_id == RoleNotification.candidate_id)
                & (NotificationSent.job_id == RoleNotification.job_id)
                & (NotificationSent.notification_type == "role_match"),
            )
            .filter(RoleNotification.candidate_id == candidate.id)
            .order_by(RoleNotification.created_at.desc(), RoleNotification.id.desc())
            .all()
        )

        notifications = []
        for role_notification, sent in rows:
            payload = {}
            if sent and sent.order_session_id:
                try:
                    payload = json.loads(sent.order_session_id)
                except json.JSONDecodeError:
                    payload = {}
            notifications.append({
                "id": role_notification.id,
                "job_id": role_notification.job_id,
                "match_score": role_notification.match_score,
                "response_status": role_notification.response_status,
                "responded_at": role_notification.responded_at.isoformat() if role_notification.responded_at else None,
                "sent_at": sent.sent_at.isoformat() if sent and sent.sent_at else None,
                "status": sent.status if sent else None,
                "title": payload.get("title"),
                "company": payload.get("company"),
                "location": payload.get("location"),
                "url": payload.get("url"),
                "summary": payload.get("summary"),
            })
        return notifications

    def create_role_notification(
        self,
        session: Session,
        candidate: Candidate,
        *,
        job_id: str,
        match_score: float,
        title: str,
        company: str,
        location: str,
        url: str,
        summary: str = "",
    ) -> dict:
        if candidate.source != "runtimeresume":
            return {"status": "skipped", "reason": "wrong_source"}
        if not candidate.open_to_representation:
            return {"status": "skipped", "reason": "representation_disabled"}
        if candidate.job_seek_status == "not_seeking":
            return {"status": "skipped", "reason": "not_seeking"}
        if self.recently_notified(session, candidate.id, "role_match", job_id=job_id):
            return {"status": "skipped", "reason": "recently_notified"}

        existing = (
            session.query(RoleNotification)
            .filter(RoleNotification.candidate_id == candidate.id)
            .filter(RoleNotification.job_id == job_id)
            .one_or_none()
        )
        if existing is None:
            existing = RoleNotification(
                candidate_id=candidate.id,
                job_id=job_id,
                match_score=match_score,
                response_status="sent",
            )
            session.add(existing)
            session.flush()
        else:
            existing.match_score = match_score
            existing.response_status = existing.response_status or "sent"

        subject = f"Role match: {title} at {company}"
        email_result = EmailService().send_role_match_email(
            session=session,
            settings=get_settings(),
            candidate=candidate,
            template_id=f"role_match:{job_id}",
            subject=subject,
            title=title,
            company=company,
            location=location,
            url=url,
            summary=summary,
        )
        sent_status = "sent" if email_result.get("delivery_mode") in {"ses", "smtp"} else "preview_only"
        sent = NotificationSent(
            candidate_id=candidate.id,
            notification_type="role_match",
            job_id=job_id,
            order_session_id=json.dumps({
                "title": title,
                "company": company,
                "location": location,
                "url": url,
                "summary": summary,
            }),
            ses_message_id=email_result.get("ses_message_id"),
            status=sent_status,
            sent_at=utc_now(),
        )
        session.add(sent)
        session.flush()
        return {"status": sent_status, "notification_id": existing.id}

    def record_response(
        self,
        session: Session,
        candidate: Candidate,
        notification_id: int,
        response_status: str,
    ) -> RoleNotification:
        normalized = (response_status or "").strip().lower()
        if normalized not in {"interested", "not_interested"}:
            raise ValueError("Response status must be 'interested' or 'not_interested'")

        notification = (
            session.query(RoleNotification)
            .filter(RoleNotification.id == notification_id)
            .filter(RoleNotification.candidate_id == candidate.id)
            .one_or_none()
        )
        if notification is None:
            raise ValueError("Notification not found")

        notification.response_status = normalized
        notification.responded_at = utc_now()
        session.flush()

        OpenCATSService().record_role_notification_response(
            candidate.opencats_candidate_id,
            notification.job_id,
            normalized,
        )

        return notification
