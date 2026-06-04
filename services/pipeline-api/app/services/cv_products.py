import json
from urllib.error import HTTPError
from urllib.request import Request
from urllib.request import urlopen


class CvProductsClient:
    def generate(self, *, buyer_email: str, buyer_name: str | None = None) -> dict:
        payload = {"buyer_email": buyer_email, "buyer_name": buyer_name or ""}
        request = Request(
            "http://15.235.141.132:8810/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            raise RuntimeError(error.read().decode("utf-8") or "CV products request failed") from error
