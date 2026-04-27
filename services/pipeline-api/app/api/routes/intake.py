from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.deps import require_internal_api_key
from app.db import get_db
from app.schemas.intake import IntakeSubmission
from app.schemas.intake import IntakeSubmissionResponse
from app.services.candidates import CandidateService

router = APIRouter()


@router.post("/submit", response_model=IntakeSubmissionResponse)
def submit_intake(
    payload: IntakeSubmission,
    _: None = Depends(require_internal_api_key),
    session: Session = Depends(get_db),
) -> IntakeSubmissionResponse:
    candidate_service = CandidateService()

    candidate, sync_results = candidate_service.upsert_from_intake(session, payload)
    session.commit()

    return IntakeSubmissionResponse(
        ok=True,
        session_id=payload.session_id,
        candidate_id=candidate.id,
        email=payload.email,
        opencats_sync_status=str(sync_results["opencats"].get("status", "unknown")),
        qdrant_sync_status=str(sync_results["qdrant"].get("status", "unknown")),
        resume_extraction_status=str(sync_results["resume"].get("status", "unknown")),
    )
