import hashlib
import hmac
import json
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request
from urllib.request import urlopen

from app.config import get_settings


def flatten_form(data, prefix=""):
    items = []

    if isinstance(data, dict):
        for key, value in data.items():
            next_prefix = f"{prefix}[{key}]" if prefix else str(key)
            items.extend(flatten_form(value, next_prefix))
        return items

    if isinstance(data, list):
        for index, value in enumerate(data):
            next_prefix = f"{prefix}[{index}]"
            items.extend(flatten_form(value, next_prefix))
        return items

    if data is None:
        return []

    if isinstance(data, bool):
        return [(prefix, "true" if data else "false")]

    return [(prefix, str(data))]


class StripeService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _request(self, path: str, payload: dict) -> dict:
        if not self.settings.stripe_secret_key:
            raise ValueError("Stripe secret key is not configured")

        body = urlencode(flatten_form(payload)).encode("utf-8")
        request = Request(
            f"https://api.stripe.com/v1{path}",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.settings.stripe_secret_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

        try:
            with urlopen(request) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            payload = json.loads(error.read().decode("utf-8"))
            message = payload.get("error", {}).get("message") or "Stripe request failed"
            raise RuntimeError(message) from error

    def create_checkout_session(self, payload: dict) -> dict:
        return self._request("/checkout/sessions", payload)

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature_header: str | None,
        *,
        tolerance_seconds: int = 300,
    ) -> dict:
        if not self.settings.stripe_webhook_secret:
            raise ValueError("Stripe webhook secret is not configured")
        if not signature_header:
            raise ValueError("Stripe signature header is missing")

        signature_parts: dict[str, list[str]] = {}
        for part in signature_header.split(","):
            key, separator, value = part.partition("=")
            if separator:
                signature_parts.setdefault(key, []).append(value)

        timestamps = signature_parts.get("t") or []
        signatures = signature_parts.get("v1") or []
        if not timestamps or not signatures:
            raise ValueError("Stripe signature header is malformed")

        try:
            timestamp = int(timestamps[0])
        except ValueError as error:
            raise ValueError("Stripe signature timestamp is invalid") from error

        if abs(int(time.time()) - timestamp) > tolerance_seconds:
            raise ValueError("Stripe signature timestamp is outside tolerance")

        signed_payload = f"{timestamp}.".encode("utf-8") + raw_body
        expected_signature = hmac.new(
            self.settings.stripe_webhook_secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256,
        ).hexdigest()
        if not any(hmac.compare_digest(expected_signature, signature) for signature in signatures):
            raise ValueError("Stripe signature verification failed")

        return json.loads(raw_body.decode("utf-8"))

    def create_promotion_code(
        self,
        *,
        code: str,
        amount_off: int,
        currency: str,
        metadata: dict,
        expires_at: int | None = None,
    ) -> dict:
        coupon = self._request(
            "/coupons",
            {
                "duration": "once",
                "amount_off": amount_off,
                "currency": currency.lower(),
                "name": code,
                "metadata": metadata,
            },
        )

        payload = {
            "coupon": coupon.get("id"),
            "code": code,
            "max_redemptions": 1,
            "metadata": metadata,
        }
        if expires_at is not None:
            payload["expires_at"] = expires_at

        return self._request("/promotion_codes", payload)
