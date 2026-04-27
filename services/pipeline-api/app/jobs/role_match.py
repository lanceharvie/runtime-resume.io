from app.db import SessionLocal
from app.services.role_match import RoleMatchService


def run_role_match_job(job_id: str | None = None) -> dict:
    session = SessionLocal()
    try:
        return RoleMatchService().run(session)
    finally:
        session.close()
