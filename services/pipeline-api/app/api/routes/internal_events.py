from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_internal_api_key
from app.db import get_db
from app.models.domain import Candidate
from app.models.domain import Order
from app.schemas.auth import RepresentationDecisionRequest
from app.schemas.auth import RepresentationPromptResponse
from app.services.notifications import NotificationService
from app.services.referrals import ReferralService
from app.services.representation import RepresentationService
from app.time import utc_now

router = APIRouter()


class DeliveryCompleteEvent(BaseModel):
    delivery_channel: str | None = None
    delivery_notes: str | None = None
    customer_email: str | None = None


class ReferralLookupResponse(BaseModel):
    ok: bool
    referral_code: str = ""
    promotion_code_id: str = ""
    referral_id: int | None = None


class RoleNotificationMatchPayload(BaseModel):
    candidate_id: int
    match_score: float


class RoleNotificationCreateRequest(BaseModel):
    job_id: str
    title: str
    company: str
    location: str | None = None
    url: str
    summary: str | None = None
    matches: list[RoleNotificationMatchPayload]


@router.post("/orders/{session_id}/delivery-complete")
def notify_delivery_complete(
    session_id: str,
    payload: DeliveryCompleteEvent,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> dict[str, str | bool]:
    order = session.query(Order).filter(Order.session_id == session_id).one_or_none()
    referral_service = ReferralService()
    created = False

    if order is None:
        order = Order(session_id=session_id, tier="")
        session.add(order)
        created = True

    now = utc_now()
    order.customer_email = payload.customer_email or order.customer_email
    order.delivered_at = order.delivered_at or now
    order.delivery_email_sent_at = order.delivery_email_sent_at or now
    order.representation_prompt_status = "eligible"
    order.share_prompt_status = "pending"
    order.updated_at = now

    candidate = session.query(Candidate).filter(Candidate.order_session_id == session_id).one_or_none()
    referral_code = ""
    if candidate is not None:
        referral = referral_service.get_or_create_for_candidate(session, candidate.id)
        referral_code = referral.referral_code

    session.commit()

    return {
        "ok": True,
        "message": "Pipeline order updated from delivery-complete event.",
        "session_id": session_id,
        "created": created,
        "delivery_channel": payload.delivery_channel or "",
        "representation_prompt_status": order.representation_prompt_status or "",
        "share_prompt_status": order.share_prompt_status or "",
        "referral_code": referral_code,
    }


@router.get("/orders/{session_id}/representation", response_model=RepresentationPromptResponse)
def get_internal_representation_prompt(
    session_id: str,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> RepresentationPromptResponse:
    try:
        result = RepresentationService().get_prompt(session, session_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    session.commit()
    return result


@router.post("/orders/{session_id}/representation", response_model=RepresentationPromptResponse)
def post_internal_representation_decision(
    session_id: str,
    payload: RepresentationDecisionRequest,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> RepresentationPromptResponse:
    try:
        result = RepresentationService().record_decision(session, session_id, payload.decision)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    session.commit()
    return result


@router.get("/referrals/{referral_code}", response_model=ReferralLookupResponse)
def get_internal_referral_lookup(
    referral_code: str,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> ReferralLookupResponse:
    referral = ReferralService().get_checkout_referral(session, referral_code)
    session.commit()
    if referral is None:
        return ReferralLookupResponse(ok=False)
    return ReferralLookupResponse(
        ok=True,
        referral_code=referral.referral_code,
        promotion_code_id=referral.checkout_promotion_code_id or "",
        referral_id=referral.id,
    )


@router.post("/role-notifications")
def create_internal_role_notifications(
    payload: RoleNotificationCreateRequest,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> dict:
    notification_service = NotificationService()
    results = []

    for match in payload.matches:
        candidate = session.query(Candidate).filter(Candidate.id == match.candidate_id).one_or_none()
        if candidate is None:
            results.append({"candidate_id": match.candidate_id, "status": "missing"})
            continue
        result = notification_service.create_role_notification(
            session=session,
            candidate=candidate,
            job_id=payload.job_id,
            match_score=match.match_score,
            title=payload.title,
            company=payload.company,
            location=payload.location or "",
            url=payload.url,
            summary=payload.summary or "",
        )
        result["candidate_id"] = candidate.id
        results.append(result)

    session.commit()
    return {"ok": True, "job_id": payload.job_id, "results": results}
