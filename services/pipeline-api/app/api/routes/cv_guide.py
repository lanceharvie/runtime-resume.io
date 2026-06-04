from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from fastapi import status
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.cv_guide import CvGuidePurchaseService
from app.services.cv_guide import PRODUCT_SLUG
from app.services.stripe import StripeService

router = APIRouter()

PRODUCT_PRICE_ID = "price_1TeTaSRxkZxECNpdCCzzDYJ9"
SUCCESS_URL = "https://cv.runtimerec.com/thank-you"
CANCEL_URL = "https://cv.runtimerec.com"


@router.post("/checkout")
def create_cv_guide_checkout() -> dict[str, str]:
    checkout_session = StripeService().create_checkout_session(
        {
            "mode": "payment",
            "line_items": [{"price": PRODUCT_PRICE_ID, "quantity": 1}],
            "success_url": SUCCESS_URL,
            "cancel_url": CANCEL_URL,
            "customer_creation": "always",
            "billing_address_collection": "auto",
            "metadata": {"product": PRODUCT_SLUG},
            "payment_intent_data": {"metadata": {"product": PRODUCT_SLUG}},
        }
    )
    url = str(checkout_session.get("url") or "")
    if not url:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe checkout session did not include a URL")
    return {"url": url}


@router.post("/webhook")
async def handle_cv_guide_webhook(request: Request, session: Session = Depends(get_db)) -> dict:
    raw_body = await request.body()
    signature = request.headers.get("stripe-signature")
    try:
        event = StripeService().verify_webhook_signature(raw_body, signature)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    try:
        result = CvGuidePurchaseService().process_stripe_event(session, event)
        session.commit()
        return result
    except Exception as error:
        session.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)) from error
