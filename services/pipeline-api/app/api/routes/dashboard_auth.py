from fastapi import APIRouter
from fastapi import Depends
from fastapi import Header
from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.schemas.auth import MagicLinkRequest
from app.schemas.auth import MagicLinkRequestResponse
from app.schemas.auth import MagicLinkVerifyRequest
from app.schemas.auth import MagicLinkVerifyResponse
from app.services.auth import AuthService
from app.services.email import EmailService

router = APIRouter()


@router.post("/request-link", response_model=MagicLinkRequestResponse)
def request_magic_link(payload: MagicLinkRequest, session: Session = Depends(get_db)) -> MagicLinkRequestResponse:
    settings = get_settings()
    auth_service = AuthService()
    email_service = EmailService()
    try:
        result = auth_service.issue_magic_link(session, settings, str(payload.email))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    magic_link = f"{settings.frontend_base_url}/dashboard?token={result.token}"
    try:
        email_result = email_service.send_magic_link_email(
            session,
            settings,
            result.candidate,
            magic_link,
            result.expires_at,
        )
    except Exception as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Unable to send magic link email: {error}") from error

    session.commit()
    return MagicLinkRequestResponse(
        ok=True,
        email=payload.email,
        expires_at=result.expires_at.isoformat(),
        delivery_mode=email_result["delivery_mode"],
        magic_link_preview=email_result.get("magic_link_preview"),
    )


@router.post("/verify", response_model=MagicLinkVerifyResponse)
def verify_magic_link(payload: MagicLinkVerifyRequest, session: Session = Depends(get_db)) -> MagicLinkVerifyResponse:
    settings = get_settings()
    auth_service = AuthService()
    try:
        result = auth_service.exchange_magic_link(session, settings, payload.token)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    session.commit()

    return MagicLinkVerifyResponse(
        ok=True,
        email=result.candidate.email,
        session_token=result.session_token,
        session_expires_at=result.session_expires_at.isoformat(),
    )


@router.post("/logout")
def logout_dashboard_session(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_db),
) -> dict[str, bool]:
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    revoked = AuthService().revoke_session_token(session, token)
    session.commit()
    return {"ok": revoked}
