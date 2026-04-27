import json
from pathlib import Path

from app.config import get_settings
from app.db import SessionLocal
from app.models.domain import Candidate
from app.services.email import EmailService
from app.services.referrals import ReferralService


def _load_feed(path: str) -> list[dict]:
    if not path:
        return []
    file_path = Path(path)
    if not file_path.exists():
        return []
    payload = json.loads(file_path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict) and isinstance(payload.get("placements"), list):
        return [item for item in payload["placements"] if isinstance(item, dict)]
    return []


def run_placed_followup_job() -> dict:
    settings = get_settings()
    feed = _load_feed(settings.placed_followup_feed_path)
    session = SessionLocal()
    try:
        sent = 0
        referral_service = ReferralService()
        for entry in feed:
            email = str(entry.get("email") or "").strip().lower()
            opencats_candidate_id = str(entry.get("opencats_candidate_id") or "").strip()
            candidate = None
            if email:
                candidate = session.query(Candidate).filter(Candidate.email == email).one_or_none()
            if candidate is None and opencats_candidate_id:
                candidate = (
                    session.query(Candidate)
                    .filter(Candidate.opencats_candidate_id == opencats_candidate_id)
                    .one_or_none()
                )
            if candidate is None:
                continue
            referral = referral_service.get_or_create_for_candidate(session, candidate.id)
            result = EmailService().send_placed_followup_email(
                session,
                settings,
                candidate=candidate,
                referral_code=referral.referral_code,
                referral_link=referral.referral_link or "",
            )
            if result.get("delivery_mode") in {"preview", "ses", "smtp", "already_sent"}:
                sent += 1
        session.commit()
        return {"ok": True, "placed_followups_sent": sent}
    finally:
        session.close()
