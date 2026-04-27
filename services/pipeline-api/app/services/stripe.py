import json
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
