from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import HttpUrl


class IntakeSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    email: EmailStr
    full_name: str | None = None
    linkedin_url: HttpUrl | None = None
    target_roles: str | None = None
    target_companies: str | None = None
    key_achievements: str | None = None
    years_experience: str | None = None
    geographic_preference: str | None = None
    target_locations: str | None = None
    salary_range: str | None = None
    role_types: str | None = None
    concerns: str | None = None
    resume_filename: str | None = None
    resume_mime_type: str | None = None
    resume_base64: str | None = None
    job_seek_status: str
    open_to_representation: bool = True
    relocation_flag: bool = False


class IntakeSubmissionResponse(BaseModel):
    ok: bool
    session_id: str
    candidate_id: int
    email: EmailStr
    opencats_sync_status: str
    qdrant_sync_status: str
    resume_extraction_status: str | None = None
