from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.resume_review_router import resume_router
from app.config import get_settings
from app.db import Base
from app.db import engine


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://cv.runtimerec.com",
            "https://runtimeresume.io",
            "https://resumerewrite.io",
        ],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Internal-Api-Key"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        if settings.auto_create_schema:
            Base.metadata.create_all(bind=engine)

    app.include_router(api_router)
    app.include_router(resume_router, prefix="/resume", tags=["resume"])
    return app


app = create_app()
