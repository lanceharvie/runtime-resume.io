from fastapi import APIRouter
from fastapi import Depends
from fastapi import Header
from fastapi import HTTPException
from fastapi import status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.domain import Order
from app.schemas.auth import DashboardPreferencesUpdateRequest
from app.schemas.auth import DashboardNotificationsResponse
from app.schemas.auth import DashboardReferralResponse
from app.schemas.auth import DashboardSessionResponse
from app.schemas.auth import NotificationResponseRequest
from app.schemas.auth import RepresentationDecisionRequest
from app.schemas.auth import RepresentationPromptResponse
from app.services.auth import AuthService
from app.services.candidates import CandidateService
from app.services.notifications import NotificationService
from app.services.referrals import ReferralService
from app.services.representation import RepresentationService
from app.services.resume_storage import ResumeStorageService

router = APIRouter()


def build_dashboard_session_response(candidate, order: Order | None) -> DashboardSessionResponse:
    return DashboardSessionResponse(
        ok=True,
        email=candidate.email,
        candidate_id=candidate.id,
        full_name=candidate.full_name,
        job_seek_status=candidate.job_seek_status,
        open_to_representation=candidate.open_to_representation,
        target_roles=candidate.target_roles,
        target_locations=candidate.target_locations,
        salary_range=candidate.salary_range,
        role_types=candidate.role_types,
        geographic_preference=candidate.geographic_preference,
        relocation_flag=candidate.relocation_flag,
        opencats_candidate_id=candidate.opencats_candidate_id,
        qdrant_point_id=candidate.qdrant_point_id,
        last_opencats_sync_at=candidate.last_opencats_sync_at.isoformat() if candidate.last_opencats_sync_at else None,
        last_qdrant_sync_at=candidate.last_qdrant_sync_at.isoformat() if candidate.last_qdrant_sync_at else None,
        order_session_id=candidate.order_session_id,
        representation_prompt_status=order.representation_prompt_status if order else None,
        representation_prompted_at=order.representation_prompted_at.isoformat() if order and order.representation_prompted_at else None,
        delivered_at=order.delivered_at.isoformat() if order and order.delivered_at else None,
        resume_filename=candidate.resume_filename,
        has_resume=bool(candidate.resume_storage_path),
        resume_text_available=bool(candidate.resume_text),
    )


def get_current_candidate(authorization: str | None, session: Session):
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    candidate = AuthService().get_candidate_for_session_token(session, token)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return candidate


def get_candidate_order(session: Session, candidate) -> Order | None:
    if not candidate.order_session_id:
        return None
    return session.query(Order).filter(Order.session_id == candidate.order_session_id).one_or_none()


@router.get("/me", response_model=DashboardSessionResponse)
def get_dashboard_session(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> DashboardSessionResponse:
    candidate = get_current_candidate(authorization, session)
    order = get_candidate_order(session, candidate)

    session.commit()
    return build_dashboard_session_response(candidate, order)


@router.patch("/preferences", response_model=DashboardSessionResponse)
def update_dashboard_preferences(
    payload: DashboardPreferencesUpdateRequest,
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> DashboardSessionResponse:
    candidate = get_current_candidate(authorization, session)
    updated, _sync_results = CandidateService().update_dashboard_preferences(session, candidate, payload)
    order = get_candidate_order(session, updated)
    session.commit()

    return build_dashboard_session_response(updated, order)


@router.get("/referral", response_model=DashboardReferralResponse)
def get_dashboard_referral(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> DashboardReferralResponse:
    candidate = get_current_candidate(authorization, session)
    referral_service = ReferralService()
    referral = referral_service.get_or_create_for_candidate(session, candidate.id)
    latest_redemption = referral_service.get_latest_redemption(session, referral.id)
    session.commit()
    return DashboardReferralResponse(
        ok=True,
        referral_code=referral.referral_code,
        referral_link=referral.referral_link,
        times_used=referral.times_used,
        credits_earned=referral.credits_earned,
        last_redeemed_at=referral.last_redeemed_at.isoformat() if referral.last_redeemed_at else None,
        latest_reward_status=latest_redemption.reward_status if latest_redemption else None,
        latest_reward_code=latest_redemption.reward_discount_code if latest_redemption else None,
        latest_reward_expires_at=(
            latest_redemption.reward_expires_at.isoformat()
            if latest_redemption and latest_redemption.reward_expires_at
            else None
        ),
    )


@router.get("/representation", response_model=RepresentationPromptResponse)
def get_dashboard_representation_prompt(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> RepresentationPromptResponse:
    candidate = get_current_candidate(authorization, session)
    if not candidate.order_session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate order session not found")
    try:
        result = RepresentationService().get_prompt(session, candidate.order_session_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    session.commit()
    return result


@router.post("/representation", response_model=RepresentationPromptResponse)
def post_dashboard_representation_decision(
    payload: RepresentationDecisionRequest,
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> RepresentationPromptResponse:
    candidate = get_current_candidate(authorization, session)
    if not candidate.order_session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate order session not found")
    try:
        result = RepresentationService().record_decision(session, candidate.order_session_id, payload.decision)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    session.commit()
    return result


@router.get("/notifications", response_model=DashboardNotificationsResponse)
def get_dashboard_notifications(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> DashboardNotificationsResponse:
    candidate = get_current_candidate(authorization, session)
    notifications = NotificationService().list_candidate_notifications(session, candidate)
    session.commit()
    return DashboardNotificationsResponse(ok=True, notifications=notifications)


@router.post("/notifications/{notification_id}/respond", response_model=DashboardNotificationsResponse)
def respond_to_dashboard_notification(
    notification_id: int,
    payload: NotificationResponseRequest,
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> DashboardNotificationsResponse:
    candidate = get_current_candidate(authorization, session)
    try:
        NotificationService().record_response(session, candidate, notification_id, payload.response_status)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    notifications = NotificationService().list_candidate_notifications(session, candidate)
    session.commit()
    return DashboardNotificationsResponse(ok=True, notifications=notifications)


@router.get("/resume")
def download_dashboard_resume(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
):
    candidate = get_current_candidate(authorization, session)
    resume_path = ResumeStorageService().locate_resume(candidate.resume_storage_path)
    if resume_path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate resume not found")

    session.commit()
    return FileResponse(
        path=resume_path,
        filename=candidate.resume_filename or resume_path.name,
        media_type="application/octet-stream",
    )
