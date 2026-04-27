from datetime import timedelta
from datetime import timezone
from secrets import choice
from string import ascii_uppercase
from string import digits

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.domain import Candidate
from app.models.domain import Referral
from app.models.domain import ReferralRedemption
from app.services.email import EmailService
from app.services.stripe import StripeService
from app.time import utc_now


CODE_ALPHABET = ascii_uppercase + digits
CUSTOMER_DISCOUNT_AMOUNT = "3000"
REWARD_DISCOUNT_AMOUNT = "3000"
REWARD_EXPIRY_DAYS = 90


def build_referral_code() -> str:
    return "RT" + "".join(choice(CODE_ALPHABET) for _ in range(6))


def normalize_referral_code(value: str | None) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = "".join(char for char in value.upper() if char.isalnum())
    return cleaned


def build_reward_code() -> str:
    return "RTR" + "".join(choice(CODE_ALPHABET) for _ in range(8))


class ReferralService:
    def _build_referral_link(self, referral_code: str) -> str:
        settings = get_settings()
        return f"{settings.frontend_base_url.rstrip('/')}/order?ref={referral_code}"

    def _lookup_referral(self, session: Session, referral_code: str) -> Referral | None:
        normalized = normalize_referral_code(referral_code)
        if not normalized:
            return None

        candidates = {normalized}
        if normalized.startswith("RT") and len(normalized) > 2:
            candidates.add(f"RT-{normalized[2:]}")

        return (
            session.query(Referral)
            .filter(Referral.referral_code.in_(sorted(candidates)))
            .order_by(Referral.id.asc())
            .first()
        )

    def ensure_checkout_discount(self, session: Session, referral: Referral) -> Referral:
        if referral.checkout_promotion_code_id:
            return referral

        settings = get_settings()
        if not settings.stripe_secret_key:
            referral.referral_link = referral.referral_link or self._build_referral_link(referral.referral_code)
            session.flush()
            return referral

        promotion_code = StripeService().create_promotion_code(
            code=normalize_referral_code(referral.referral_code),
            amount_off=int(CUSTOMER_DISCOUNT_AMOUNT),
            currency="usd",
            metadata={
                "kind": "candidate_referral",
                "referral_code": normalize_referral_code(referral.referral_code),
                "referral_id": referral.id,
                "candidate_id": referral.candidate_id,
            },
        )
        referral.checkout_promotion_code_id = str(promotion_code.get("id") or "")
        referral.referral_link = self._build_referral_link(referral.referral_code)
        session.flush()
        return referral

    def get_or_create_for_candidate(self, session: Session, candidate_id: int) -> Referral:
        existing = session.query(Referral).filter(Referral.candidate_id == candidate_id).one_or_none()
        if existing is not None:
            existing.referral_link = existing.referral_link or self._build_referral_link(existing.referral_code)
            self.ensure_checkout_discount(session, existing)
            return existing

        referral = None

        while referral is None:
            code = build_referral_code()
            collision = session.query(Referral).filter(Referral.referral_code == code).one_or_none()
            if collision is not None:
                continue

            referral = Referral(
                candidate_id=candidate_id,
                referral_code=code,
                referral_link=self._build_referral_link(code),
            )
            session.add(referral)
            session.flush()

        return self.ensure_checkout_discount(session, referral)

    def get_checkout_referral(self, session: Session, referral_code: str) -> Referral | None:
        referral = self._lookup_referral(session, referral_code)
        if referral is None:
            return None
        return self.ensure_checkout_discount(session, referral)

    def get_latest_redemption(self, session: Session, referral_id: int) -> ReferralRedemption | None:
        return (
            session.query(ReferralRedemption)
            .filter(ReferralRedemption.referral_id == referral_id)
            .order_by(ReferralRedemption.id.desc())
            .first()
        )

    def process_referral_redemption(self, session: Session, order, event: dict) -> ReferralRedemption | None:
        settings = get_settings()
        checkout_session = event.get("data", {}).get("object") or {}
        custom_data = checkout_session.get("metadata") or {}
        referral_code = custom_data.get("referral_code") or custom_data.get("referralCode") or ""
        referral = self.get_checkout_referral(session, referral_code)
        if referral is None:
            return None

        redeemer_order_session_id = str(custom_data.get("session_id") or order.session_id or "")
        stripe_checkout_id = str(checkout_session.get("id") or order.stripe_checkout_id or "")
        redeemer_email = (
            checkout_session.get("customer_details", {}).get("email")
            or checkout_session.get("customer_email")
            or order.customer_email
            or None
        )

        candidate = session.query(Candidate).filter(Candidate.id == referral.candidate_id).one_or_none()
        if candidate is None:
            return None

        if redeemer_email and redeemer_email.lower() == candidate.email.lower():
            existing = (
                session.query(ReferralRedemption)
                .filter(ReferralRedemption.referral_id == referral.id)
                .filter(ReferralRedemption.redeemer_order_session_id == redeemer_order_session_id)
                .one_or_none()
            )
            if existing is not None:
                return existing
            redemption = ReferralRedemption(
                referral_id=referral.id,
                redeemer_order_session_id=redeemer_order_session_id or None,
                redeemer_email=redeemer_email,
                stripe_checkout_id=stripe_checkout_id or None,
                reward_status="self_referral_blocked",
            )
            session.add(redemption)
            session.flush()
            return redemption

        existing = None
        if stripe_checkout_id:
            existing = (
                session.query(ReferralRedemption)
                .filter(ReferralRedemption.stripe_checkout_id == stripe_checkout_id)
                .one_or_none()
            )
        if existing is None and redeemer_order_session_id:
            existing = (
                session.query(ReferralRedemption)
                .filter(ReferralRedemption.redeemer_order_session_id == redeemer_order_session_id)
                .one_or_none()
            )
        if existing is not None:
            return existing

        if not settings.stripe_secret_key:
            redemption = ReferralRedemption(
                referral_id=referral.id,
                redeemer_order_session_id=redeemer_order_session_id or None,
                redeemer_email=redeemer_email,
                stripe_checkout_id=stripe_checkout_id or None,
                reward_status="reward_unavailable",
            )
            session.add(redemption)
            referral.times_used = int(referral.times_used or 0) + 1
            referral.credits_earned = int(referral.credits_earned or 0) + 30
            referral.last_redeemed_at = utc_now()
            session.flush()
            return redemption

        reward_code = build_reward_code()
        reward_expires_at = utc_now() + timedelta(days=REWARD_EXPIRY_DAYS)
        promotion_code = StripeService().create_promotion_code(
            code=reward_code,
            amount_off=int(REWARD_DISCOUNT_AMOUNT),
            currency="usd",
            expires_at=int(reward_expires_at.replace(tzinfo=timezone.utc).timestamp()),
            metadata={
                "kind": "referrer_reward",
                "reward_code": reward_code,
                "referral_id": referral.id,
                "candidate_id": candidate.id,
                "redeemer_order_session_id": redeemer_order_session_id or None,
            },
        )

        redemption = ReferralRedemption(
            referral_id=referral.id,
            redeemer_order_session_id=redeemer_order_session_id or None,
            redeemer_email=redeemer_email,
            stripe_checkout_id=stripe_checkout_id or None,
            reward_status="reward_created",
            reward_discount_id=str(promotion_code.get("id") or ""),
            reward_discount_code=reward_code,
            reward_expires_at=reward_expires_at,
        )
        session.add(redemption)

        referral.times_used = int(referral.times_used or 0) + 1
        referral.credits_earned = int(referral.credits_earned or 0) + 30
        referral.last_redeemed_at = utc_now()
        session.flush()

        delivery = EmailService().send_referral_reward_email(
            session=session,
            settings=settings,
            candidate=candidate,
            redemption=redemption,
        )
        if delivery.get("delivery_mode") in {"preview", "ses", "smtp", "already_sent"}:
            redemption.reward_email_sent_at = utc_now()
            redemption.reward_status = "reward_sent"
        else:
            redemption.reward_status = "reward_created"
        session.flush()
        return redemption
