from datetime import timedelta
from urllib.parse import quote

from app.config import get_settings
from app.db import SessionLocal
from app.models.domain import Order
from app.services.email import EmailService
from app.time import ensure_utc
from app.time import utc_now


def run_share_prompt_job() -> dict:
    settings = get_settings()
    session = SessionLocal()
    try:
        cutoff = utc_now() - timedelta(hours=settings.share_prompt_delay_hours)
        orders = (
            session.query(Order)
            .filter(Order.delivered_at.is_not(None))
            .filter(Order.share_prompt_status == "pending")
            .all()
        )
        sent = 0
        for order in orders:
            delivered_at = ensure_utc(order.delivered_at)
            if delivered_at is None or delivered_at > cutoff:
                continue
            recipient = order.customer_email or ""
            if not recipient:
                continue
            customer_name = order.customer_name or recipient
            share_text = quote("My resume update with RunTime Resume is complete.")
            share_url = f"https://www.linkedin.com/feed/?shareActive=true&text={share_text}"
            result = EmailService().send_share_prompt_email(
                session,
                settings,
                recipient=recipient,
                customer_name=customer_name,
                order_session_id=order.session_id,
                share_url=share_url,
            )
            if result.get("delivery_mode") in {"preview", "ses", "smtp", "already_sent"}:
                order.share_prompt_status = "sent"
                order.share_prompt_sent_at = utc_now()
                sent += 1
        session.commit()
        return {"ok": True, "share_prompts_sent": sent}
    finally:
        session.close()
