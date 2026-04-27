from fastapi import APIRouter

from app.api.routes import dashboard
from app.api.routes import dashboard_auth
from app.api.routes import health
from app.api.routes import intake
from app.api.routes import internal_events
from app.api.routes import stripe_webhooks

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(intake.router, prefix="/api/intake", tags=["intake"])
api_router.include_router(stripe_webhooks.router, prefix="/api/stripe", tags=["stripe"])
api_router.include_router(dashboard_auth.router, prefix="/api/dashboard/auth", tags=["dashboard-auth"])
api_router.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
api_router.include_router(internal_events.router, prefix="/api/internal", tags=["internal"])
