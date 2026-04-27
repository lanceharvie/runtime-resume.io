from datetime import timedelta

from app.config import get_settings
from app.db import SessionLocal
from app.models.domain import Order
from app.services.email import EmailService
from app.time import ensure_utc
from app.time import utc_now


def run_refresh_offer_job() -> dict:
    settings = get_settings()
    session = SessionLocal()
    try:
        now = utc_now()
        sent = 0
        orders = (
            session.query(Order)
            .filter(Order.delivered_at.is_not(None))
            .filter(Order.refresh_email_sent.is_(False))
            .all()
        )
        for order in orders:
            delivered_at = ensure_utc(order.delivered_at)
            if delivered_at is None:
                continue
            age_days = (now - delivered_at).days
            if age_days < settings.refresh_offer_min_days or age_days > settings.refresh_offer_max_days:
                continue
            recipient = order.customer_email or ""
            if not recipient:
                continue
            refresh_link = f"{settings.frontend_base_url.rstrip('/')}/order?tier={order.tier or 'full-rewrite'}"
            result = EmailService().send_refresh_offer_email(
                session,
                settings,
                recipient=recipient,
                customer_name=order.customer_name or recipient,
                order_session_id=order.session_id,
                refresh_link=refresh_link,
            )
            if result.get("delivery_mode") in {"preview", "ses", "smtp", "already_sent"}:
                order.refresh_email_sent = True
                order.refresh_email_sent_at = now
                sent += 1
        session.commit()
        return {"ok": True, "refresh_offers_sent": sent}
    finally:
        session.close()
