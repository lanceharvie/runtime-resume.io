import json

from sqlalchemy.orm import Session

from app.models.domain import Order
from app.time import utc_now


def extract_amount_total(checkout_session: dict) -> int | None:
    amount_total = checkout_session.get("amount_total")
    if isinstance(amount_total, (int, float)):
        return round(amount_total)
    if isinstance(amount_total, str) and amount_total.strip():
        try:
            return round(float(amount_total))
        except ValueError:
            return None
    return None


class OrderService:
    def upsert_from_stripe_event(self, session: Session, event: dict) -> Order:
        checkout_session = event.get("data", {}).get("object") or {}
        custom_data = checkout_session.get("metadata") or {}
        session_id = custom_data.get("session_id") or checkout_session.get("client_reference_id") or checkout_session.get("id") or ""
        if not session_id:
            raise ValueError("Unable to determine session_id from Stripe event")

        order = session.query(Order).filter(Order.session_id == str(session_id)).one_or_none()
        if order is None:
            order = Order(session_id=str(session_id), tier=str(custom_data.get("tier_slug") or ""))
            session.add(order)

        event_type = str(event.get("type") or "")
        status = str(checkout_session.get("status") or "")
        payment_status = str(checkout_session.get("payment_status") or "")
        is_paid = event_type == "checkout.session.completed" or payment_status == "paid"
        is_failed = event_type in {"checkout.session.async_payment_failed", "checkout.session.expired"}

        order.stripe_checkout_id = str(checkout_session.get("id")) if checkout_session.get("id") else order.stripe_checkout_id
        order.stripe_customer_id = str(checkout_session.get("customer")) if checkout_session.get("customer") else order.stripe_customer_id
        order.customer_email = (
            checkout_session.get("customer_details", {}).get("email")
            or checkout_session.get("customer_email")
            or order.customer_email
        )
        order.customer_name = (
            checkout_session.get("customer_details", {}).get("name")
            or order.customer_name
        )
        order.tier = str(custom_data.get("tier_slug") or order.tier or "")
        order.tier_name = str(custom_data.get("tier_name") or order.tier_name or "")
        order.addons_json = json.dumps(
            [item.strip() for item in str(custom_data.get("addon_slugs") or "").split(",") if item.strip()]
        )
        order.checkout_status = status or order.checkout_status
        order.payment_status = "paid" if is_paid else "failed" if is_failed else payment_status or status or order.payment_status
        order.amount_total = extract_amount_total(checkout_session)
        order.currency = str(checkout_session.get("currency") or order.currency or "").lower() or None
        if is_paid and not order.paid_at:
            order.paid_at = utc_now()
        order.updated_at = utc_now()

        session.flush()
        return order
