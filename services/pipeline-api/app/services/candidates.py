from sqlalchemy.orm import Session

from app.models.domain import Candidate
from app.models.domain import CandidateProfile
from app.schemas.intake import IntakeSubmission
from app.schemas.auth import DashboardPreferencesUpdateRequest
from app.services.opencats import OpenCATSService
from app.services.qdrant import QdrantService
from app.services.resume_storage import ResumeStorageService
from app.time import utc_now


class CandidateService:
    def _sync_candidate_integrations(self, candidate: Candidate, profile: CandidateProfile | None = None) -> dict:
        payload = {
            "pipeline_candidate_id": candidate.id,
            "order_session_id": candidate.order_session_id,
            "email": candidate.email,
            "full_name": candidate.full_name,
            "linkedin_url": candidate.linkedin_url,
            "source": candidate.source,
            "job_seek_status": candidate.job_seek_status,
            "open_to_representation": candidate.open_to_representation,
            "target_roles": candidate.target_roles,
            "target_locations": candidate.target_locations,
            "salary_range": candidate.salary_range,
            "role_types": candidate.role_types,
            "years_experience": candidate.years_experience,
            "geographic_preference": candidate.geographic_preference,
            "relocation_flag": candidate.relocation_flag,
            "target_companies": profile.target_companies if profile else None,
            "key_achievements": profile.key_achievements if profile else None,
            "concerns": profile.concerns if profile else None,
            "qdrant_point_id": candidate.qdrant_point_id,
        }
        opencats_result = OpenCATSService().upsert_candidate(payload)
        payload["opencats_candidate_id"] = opencats_result.get("candidate_id")
        qdrant_result = QdrantService().upsert_candidate_payload(payload)
        return {
            "opencats": opencats_result,
            "qdrant": qdrant_result,
        }

    def upsert_from_intake(self, session: Session, payload: IntakeSubmission) -> tuple[Candidate, dict]:
        candidate = session.query(Candidate).filter(Candidate.email == str(payload.email)).one_or_none()

        if candidate is None:
            candidate = Candidate(email=str(payload.email))
            session.add(candidate)

        candidate.order_session_id = payload.session_id
        candidate.full_name = payload.full_name
        candidate.linkedin_url = str(payload.linkedin_url) if payload.linkedin_url else None
        candidate.source = "runtimeresume"
        candidate.job_seek_status = payload.job_seek_status
        candidate.open_to_representation = payload.open_to_representation
        candidate.target_roles = payload.target_roles
        candidate.target_locations = payload.target_locations
        candidate.salary_range = payload.salary_range
        candidate.relocation_flag = payload.relocation_flag
        candidate.role_types = payload.role_types
        candidate.years_experience = payload.years_experience
        candidate.geographic_preference = payload.geographic_preference

        resume_result = ResumeStorageService().store_resume(
            session_id=payload.session_id,
            filename=payload.resume_filename,
            mime_type=payload.resume_mime_type,
            base64_data=payload.resume_base64,
        )
        if resume_result is not None:
            candidate.resume_filename = resume_result.filename
            candidate.resume_storage_path = resume_result.storage_path
            candidate.resume_text = resume_result.extracted_text

        session.flush()

        profile = session.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate.id).one_or_none()
        if profile is None:
            profile = CandidateProfile(candidate_id=candidate.id)
            session.add(profile)

        profile.target_companies = payload.target_companies
        profile.key_achievements = payload.key_achievements
        profile.concerns = payload.concerns

        sync_results = self._sync_candidate_integrations(candidate, profile)
        now = utc_now()
        candidate.opencats_candidate_id = (
            str(sync_results["opencats"].get("candidate_id")) or candidate.opencats_candidate_id
        )
        candidate.qdrant_point_id = str(sync_results["qdrant"].get("point_id") or candidate.qdrant_point_id or "")
        if sync_results["opencats"].get("status") in {"created", "updated"}:
            candidate.last_opencats_sync_at = now
        if sync_results["qdrant"].get("status") in {"created", "updated"}:
            candidate.last_qdrant_sync_at = now

        session.flush()
        sync_results["resume"] = {
            "status": resume_result.extraction_status if resume_result is not None else "not_provided",
            "storage_path": resume_result.storage_path if resume_result is not None else None,
        }
        return candidate, sync_results

    def update_dashboard_preferences(
        self,
        session: Session,
        candidate: Candidate,
        payload: DashboardPreferencesUpdateRequest,
    ) -> tuple[Candidate, dict]:
        candidate.full_name = payload.full_name
        candidate.job_seek_status = payload.job_seek_status
        candidate.open_to_representation = payload.open_to_representation
        candidate.target_roles = payload.target_roles
        candidate.target_locations = payload.target_locations
        candidate.salary_range = payload.salary_range
        candidate.role_types = payload.role_types
        candidate.geographic_preference = payload.geographic_preference
        candidate.relocation_flag = payload.relocation_flag
        profile = session.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate.id).one_or_none()
        sync_results = self._sync_candidate_integrations(candidate, profile)
        now = utc_now()
        candidate.opencats_candidate_id = (
            str(sync_results["opencats"].get("candidate_id")) or candidate.opencats_candidate_id
        )
        candidate.qdrant_point_id = str(sync_results["qdrant"].get("point_id") or candidate.qdrant_point_id or "")
        if sync_results["opencats"].get("status") in {"created", "updated"}:
            candidate.last_opencats_sync_at = now
        if sync_results["qdrant"].get("status") in {"created", "updated"}:
            candidate.last_qdrant_sync_at = now
        session.flush()
        return candidate, sync_results

    def sync_candidate(self, session: Session, candidate: Candidate) -> tuple[Candidate, dict]:
        profile = session.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate.id).one_or_none()
        sync_results = self._sync_candidate_integrations(candidate, profile)
        now = utc_now()
        candidate.opencats_candidate_id = (
            str(sync_results["opencats"].get("candidate_id")) or candidate.opencats_candidate_id
        )
        candidate.qdrant_point_id = str(sync_results["qdrant"].get("point_id") or candidate.qdrant_point_id or "")
        if sync_results["opencats"].get("status") in {"created", "updated"}:
            candidate.last_opencats_sync_at = now
        if sync_results["qdrant"].get("status") in {"created", "updated"}:
            candidate.last_qdrant_sync_at = now
        session.flush()
        return candidate, sync_results
