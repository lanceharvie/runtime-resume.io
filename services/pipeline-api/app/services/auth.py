from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from hashlib import sha256
from secrets import token_urlsafe

from sqlalchemy.orm import Session

from app.config import Settings
from app.models.domain import Candidate
from app.models.domain import CandidateSession
from app.time import ensure_utc
from app.time import utc_now


def hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


@dataclass
class MagicLinkResult:
    candidate: Candidate
    session: CandidateSession
    token: str
    expires_at: datetime


@dataclass
class SessionExchangeResult:
    candidate: Candidate
    session: CandidateSession
    session_token: str
    session_expires_at: datetime


class AuthService:
    def issue_magic_link(self, session: Session, settings: Settings, email: str) -> MagicLinkResult:
        candidate = session.query(Candidate).filter(Candidate.email == email).one_or_none()
        if candidate is None:
            raise ValueError("No candidate exists for that email")

        now = utc_now()
        expires_at = now + timedelta(minutes=settings.magic_link_expiry_minutes)
        raw_token = token_urlsafe(32)
        session_row = CandidateSession(
            candidate_id=candidate.id,
            email=email,
            magic_token_hash=hash_token(raw_token),
            login_token_expires_at=expires_at,
            created_at=now,
        )
        session.add(session_row)
        session.flush()

        return MagicLinkResult(
            candidate=candidate,
            session=session_row,
            token=raw_token,
            expires_at=expires_at,
        )

    def exchange_magic_link(self, session: Session, settings: Settings, token: str) -> SessionExchangeResult:
        now = utc_now()
        token_hash = hash_token(token)
        session_row = (
            session.query(CandidateSession)
            .filter(CandidateSession.magic_token_hash == token_hash)
            .one_or_none()
        )

        if session_row is None:
            raise ValueError("Invalid magic link token")
        if session_row.revoked_at is not None:
            raise ValueError("Magic link token has been revoked")
        login_token_expires_at = ensure_utc(session_row.login_token_expires_at)
        if login_token_expires_at is None or login_token_expires_at < now:
            raise ValueError("Magic link token has expired")

        candidate = session.query(Candidate).filter(Candidate.id == session_row.candidate_id).one()
        session_token = token_urlsafe(32)
        session_expires_at = now + timedelta(minutes=settings.dashboard_session_ttl_minutes)

        session_row.magic_token_hash = None
        session_row.login_token_expires_at = None
        session_row.session_token_hash = hash_token(session_token)
        session_row.session_expires_at = session_expires_at
        session_row.last_seen_at = now
        session.flush()

        return SessionExchangeResult(
            candidate=candidate,
            session=session_row,
            session_token=session_token,
            session_expires_at=session_expires_at,
        )

    def get_candidate_for_session_token(self, session: Session, token: str) -> Candidate | None:
        if not token:
            return None

        now = utc_now()
        token_hash = hash_token(token)
        session_row = (
            session.query(CandidateSession)
            .filter(CandidateSession.session_token_hash == token_hash)
            .one_or_none()
        )
        if session_row is None:
            return None
        if session_row.revoked_at is not None:
            return None
        session_expires_at = ensure_utc(session_row.session_expires_at)
        if session_expires_at is None or session_expires_at < now:
            return None

        session_row.last_seen_at = now
        session.flush()
        return session.query(Candidate).filter(Candidate.id == session_row.candidate_id).one_or_none()

    def revoke_session_token(self, session: Session, token: str) -> bool:
        if not token:
            return False

        token_hash = hash_token(token)
        session_row = (
            session.query(CandidateSession)
            .filter(CandidateSession.session_token_hash == token_hash)
            .one_or_none()
        )
        if session_row is None:
            return False

        session_row.revoked_at = utc_now()
        session_row.session_token_hash = None
        session_row.session_expires_at = None
        session.flush()
        return True
