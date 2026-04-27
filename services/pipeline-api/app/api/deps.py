from fastapi import Header
from fastapi import HTTPException
from fastapi import status

from app.config import get_settings


def require_internal_api_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    expected = settings.internal_api_key

    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PIPELINE_INTERNAL_API_KEY is not configured",
        )

    if x_internal_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key",
        )
