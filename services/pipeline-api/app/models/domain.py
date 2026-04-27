from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db import Base
from app.time import utc_now


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    stripe_checkout_id: Mapped[str | None] = mapped_column(String(128))
    stripe_customer_id: Mapped[str | None] = mapped_column(String(128))
    customer_email: Mapped[str | None] = mapped_column(String(255), index=True)
    customer_name: Mapped[str | None] = mapped_column(String(255))
    tier: Mapped[str] = mapped_column(String(64))
    tier_name: Mapped[str | None] = mapped_column(String(128))
    addons_json: Mapped[str] = mapped_column(Text, default="[]")
    payment_status: Mapped[str | None] = mapped_column(String(64))
    checkout_status: Mapped[str | None] = mapped_column(String(64))
    amount_total: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str | None] = mapped_column(String(16))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime)
    delivery_email_sent_at: Mapped[datetime | None] = mapped_column(DateTime)
    representation_prompt_status: Mapped[str | None] = mapped_column(String(64))
    representation_prompted_at: Mapped[datetime | None] = mapped_column(DateTime)
    share_prompt_status: Mapped[str | None] = mapped_column(String(64))
    share_prompt_sent_at: Mapped[datetime | None] = mapped_column(DateTime)
    refresh_email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    refresh_email_sent_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_session_id: Mapped[str | None] = mapped_column(String(128), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    linkedin_url: Mapped[str | None] = mapped_column(Text)
    resume_filename: Mapped[str | None] = mapped_column(String(255))
    resume_storage_path: Mapped[str | None] = mapped_column(Text)
    resume_text: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(64), default="runtimeresume")
    job_seek_status: Mapped[str] = mapped_column(String(64), default="open_to_opportunities")
    open_to_representation: Mapped[bool] = mapped_column(Boolean, default=True)
    target_roles: Mapped[str | None] = mapped_column(Text)
    target_locations: Mapped[str | None] = mapped_column(Text)
    salary_range: Mapped[str | None] = mapped_column(String(128))
    relocation_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    role_types: Mapped[str | None] = mapped_column(Text)
    years_experience: Mapped[str | None] = mapped_column(String(64))
    geographic_preference: Mapped[str | None] = mapped_column(String(255))
    opencats_candidate_id: Mapped[str | None] = mapped_column(String(128), index=True)
    qdrant_point_id: Mapped[str | None] = mapped_column(String(128), index=True)
    last_opencats_sync_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_qdrant_sync_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), primary_key=True)
    target_companies: Mapped[str | None] = mapped_column(Text)
    key_achievements: Mapped[str | None] = mapped_column(Text)
    concerns: Mapped[str | None] = mapped_column(Text)
    niche_tags_json: Mapped[str] = mapped_column(Text, default="[]")
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")


class CandidateSession(Base):
    __tablename__ = "candidate_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    magic_token_hash: Mapped[str | None] = mapped_column(String(255), index=True)
    login_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    session_token_hash: Mapped[str | None] = mapped_column(String(255), index=True)
    session_expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    referral_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    checkout_promotion_code_id: Mapped[str | None] = mapped_column(String(128), index=True)
    referral_link: Mapped[str | None] = mapped_column(Text)
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    credits_earned: Mapped[int] = mapped_column(Integer, default=0)
    last_redeemed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class ReferralRedemption(Base):
    __tablename__ = "referral_redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"), index=True)
    redeemer_order_session_id: Mapped[str | None] = mapped_column(String(128), index=True)
    redeemer_email: Mapped[str | None] = mapped_column(String(255), index=True)
    stripe_checkout_id: Mapped[str | None] = mapped_column(String(128), index=True)
    reward_status: Mapped[str | None] = mapped_column(String(64))
    reward_discount_id: Mapped[str | None] = mapped_column(String(128))
    reward_discount_code: Mapped[str | None] = mapped_column(String(64))
    reward_expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    reward_email_sent_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class NotificationSent(Base):
    __tablename__ = "notifications_sent"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    notification_type: Mapped[str] = mapped_column(String(64), index=True)
    job_id: Mapped[str | None] = mapped_column(String(128), index=True)
    order_session_id: Mapped[str | None] = mapped_column(String(128), index=True)
    ses_message_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(64), default="queued")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class EmailLog(Base):
    __tablename__ = "email_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int | None] = mapped_column(ForeignKey("candidates.id"), index=True)
    order_session_id: Mapped[str | None] = mapped_column(String(128), index=True)
    template_id: Mapped[str] = mapped_column(String(128), index=True)
    recipient: Mapped[str] = mapped_column(String(255), index=True)
    subject: Mapped[str] = mapped_column(String(255))
    ses_message_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(64), default="queued")
    provider_payload_json: Mapped[str] = mapped_column(Text, default="{}")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class StripeEvent(Base):
    __tablename__ = "stripe_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(128), index=True)
    checkout_id: Mapped[str | None] = mapped_column(String(128), index=True)
    processing_status: Mapped[str] = mapped_column(String(64), default="received")
    payload_json: Mapped[str] = mapped_column(Text)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)
    error_message: Mapped[str | None] = mapped_column(Text)


class RoleNotification(Base):
    __tablename__ = "role_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True)
    job_id: Mapped[str] = mapped_column(String(128), index=True)
    match_score: Mapped[float] = mapped_column(Float)
    response_status: Mapped[str | None] = mapped_column(String(64))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
