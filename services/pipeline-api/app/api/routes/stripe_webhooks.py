import json

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.deps import require_internal_api_key
from app.db import get_db
from app.models.domain import StripeEvent
from app.services.orders import OrderService
from app.services.referrals import ReferralService
from app.time import utc_now

router = APIRouter()


@router.post("/webhooks")
async def handle_stripe_webhook(
    payload: dict,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> dict[str, str | bool]:
    event = payload or {}
    checkout_session = event.get("data", {}).get("object") or {}
    event_id = event.get("id") or f"{event.get('type', 'unknown')}-unknown"
    event_type = event.get("type") or "stripe.unknown"
    checkout_id = checkout_session.get("id")
    now = utc_now()
    order_service = OrderService()
    referral_service = ReferralService()

    existing = session.query(StripeEvent).filter(StripeEvent.event_id == event_id).one_or_none()
    created = existing is None

    if existing is None:
        existing = StripeEvent(
            event_id=str(event_id),
            event_type=str(event_type),
            checkout_id=str(checkout_id) if checkout_id else None,
            processing_status="received",
            payload_json=json.dumps(event),
            processed_at=now,
            error_message=None,
        )
        session.add(existing)
    else:
        existing.event_type = str(event_type)
        existing.checkout_id = str(checkout_id) if checkout_id else existing.checkout_id
        existing.processing_status = "received"
        existing.payload_json = json.dumps(event)
        existing.processed_at = now
        existing.error_message = None

    order_session_id = None
    try:
        order = order_service.upsert_from_stripe_event(session, event)
        order_session_id = order.session_id
        referral_service.process_referral_redemption(session, order, event)
        existing.processing_status = "processed"
    except Exception as error:
        existing.processing_status = "failed"
        existing.error_message = str(error)

    session.commit()

    return {
        "ok": True,
        "created": created,
        "event_id": str(event_id),
        "event_type": str(event_type),
        "order_session_id": order_session_id or "",
        "processing_status": existing.processing_status,
    }
