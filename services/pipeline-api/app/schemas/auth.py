from pydantic import BaseModel
from pydantic import EmailStr


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerifyRequest(BaseModel):
    token: str


class MagicLinkRequestResponse(BaseModel):
    ok: bool
    email: EmailStr
    expires_at: str
    delivery_mode: str
    magic_link_preview: str | None = None


class MagicLinkVerifyResponse(BaseModel):
    ok: bool
    email: EmailStr
    session_token: str
    session_expires_at: str


class DashboardSessionResponse(BaseModel):
    ok: bool
    email: EmailStr
    candidate_id: int
    full_name: str | None = None
    job_seek_status: str
    open_to_representation: bool
    target_roles: str | None = None
    target_locations: str | None = None
    salary_range: str | None = None
    role_types: str | None = None
    geographic_preference: str | None = None
    relocation_flag: bool = False
    opencats_candidate_id: str | None = None
    qdrant_point_id: str | None = None
    last_opencats_sync_at: str | None = None
    last_qdrant_sync_at: str | None = None
    order_session_id: str | None = None
    representation_prompt_status: str | None = None
    representation_prompted_at: str | None = None
    delivered_at: str | None = None
    resume_filename: str | None = None
    has_resume: bool = False
    resume_text_available: bool = False


class DashboardPreferencesUpdateRequest(BaseModel):
    full_name: str | None = None
    job_seek_status: str
    open_to_representation: bool
    target_roles: str | None = None
    target_locations: str | None = None
    salary_range: str | None = None
    role_types: str | None = None
    geographic_preference: str | None = None
    relocation_flag: bool = False


class DashboardReferralResponse(BaseModel):
    ok: bool
    referral_code: str
    referral_link: str | None = None
    times_used: int
    credits_earned: int
    last_redeemed_at: str | None = None
    latest_reward_status: str | None = None
    latest_reward_code: str | None = None
    latest_reward_expires_at: str | None = None


class RepresentationDecisionRequest(BaseModel):
    decision: str


class RepresentationPromptResponse(BaseModel):
    ok: bool
    session_id: str
    candidate_id: int
    eligible: bool
    representation_prompt_status: str | None = None
    representation_prompted_at: str | None = None
    delivered_at: str | None = None
    open_to_representation: bool
    welcome_email_status: str | None = None


class DashboardNotificationItem(BaseModel):
    id: int
    job_id: str
    match_score: float
    response_status: str | None = None
    responded_at: str | None = None
    sent_at: str | None = None
    status: str | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    url: str | None = None
    summary: str | None = None


class DashboardNotificationsResponse(BaseModel):
    ok: bool
    notifications: list[DashboardNotificationItem]


class NotificationResponseRequest(BaseModel):
    response_status: str
