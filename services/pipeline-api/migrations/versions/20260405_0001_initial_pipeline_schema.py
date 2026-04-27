"""Initial pipeline schema

Revision ID: 20260405_0001
Revises:
Create Date: 2026-04-05 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260405_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.String(length=128), nullable=False),
        sa.Column("paddle_transaction_id", sa.String(length=128)),
        sa.Column("paddle_customer_id", sa.String(length=128)),
        sa.Column("customer_email", sa.String(length=255)),
        sa.Column("customer_name", sa.String(length=255)),
        sa.Column("tier", sa.String(length=64), nullable=False),
        sa.Column("tier_name", sa.String(length=128)),
        sa.Column("addons_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("payment_status", sa.String(length=64)),
        sa.Column("checkout_status", sa.String(length=64)),
        sa.Column("amount_total", sa.Integer()),
        sa.Column("currency", sa.String(length=16)),
        sa.Column("paid_at", sa.DateTime()),
        sa.Column("delivered_at", sa.DateTime()),
        sa.Column("delivery_email_sent_at", sa.DateTime()),
        sa.Column("representation_prompt_status", sa.String(length=64)),
        sa.Column("representation_prompted_at", sa.DateTime()),
        sa.Column("share_prompt_status", sa.String(length=64)),
        sa.Column("share_prompt_sent_at", sa.DateTime()),
        sa.Column("refresh_email_sent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("refresh_email_sent_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_orders_session_id", "orders", ["session_id"], unique=True)
    op.create_index("ix_orders_customer_email", "orders", ["customer_email"], unique=False)

    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_session_id", sa.String(length=128)),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255)),
        sa.Column("linkedin_url", sa.Text()),
        sa.Column("resume_filename", sa.String(length=255)),
        sa.Column("resume_storage_path", sa.Text()),
        sa.Column("resume_text", sa.Text()),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="runtimeresume"),
        sa.Column("job_seek_status", sa.String(length=64), nullable=False, server_default="open_to_opportunities"),
        sa.Column("open_to_representation", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("target_roles", sa.Text()),
        sa.Column("target_locations", sa.Text()),
        sa.Column("salary_range", sa.String(length=128)),
        sa.Column("relocation_flag", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("role_types", sa.Text()),
        sa.Column("years_experience", sa.String(length=64)),
        sa.Column("geographic_preference", sa.String(length=255)),
        sa.Column("opencats_candidate_id", sa.String(length=128)),
        sa.Column("qdrant_point_id", sa.String(length=128)),
        sa.Column("last_opencats_sync_at", sa.DateTime()),
        sa.Column("last_qdrant_sync_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_candidates_email", "candidates", ["email"], unique=True)
    op.create_index("ix_candidates_order_session_id", "candidates", ["order_session_id"], unique=False)
    op.create_index("ix_candidates_opencats_candidate_id", "candidates", ["opencats_candidate_id"], unique=False)
    op.create_index("ix_candidates_qdrant_point_id", "candidates", ["qdrant_point_id"], unique=False)

    op.create_table(
        "candidate_profiles",
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), primary_key=True),
        sa.Column("target_companies", sa.Text()),
        sa.Column("key_achievements", sa.Text()),
        sa.Column("concerns", sa.Text()),
        sa.Column("niche_tags_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("metadata_json", sa.Text(), nullable=False, server_default="{}"),
    )

    op.create_table(
        "candidate_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("magic_token_hash", sa.String(length=255)),
        sa.Column("login_token_expires_at", sa.DateTime()),
        sa.Column("session_token_hash", sa.String(length=255)),
        sa.Column("session_expires_at", sa.DateTime()),
        sa.Column("last_seen_at", sa.DateTime()),
        sa.Column("revoked_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_candidate_sessions_candidate_id", "candidate_sessions", ["candidate_id"], unique=False)
    op.create_index("ix_candidate_sessions_email", "candidate_sessions", ["email"], unique=False)
    op.create_index("ix_candidate_sessions_magic_token_hash", "candidate_sessions", ["magic_token_hash"], unique=False)
    op.create_index("ix_candidate_sessions_session_token_hash", "candidate_sessions", ["session_token_hash"], unique=False)

    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), nullable=False),
        sa.Column("referral_code", sa.String(length=64), nullable=False),
        sa.Column("paddle_discount_id", sa.String(length=128)),
        sa.Column("referral_link", sa.Text()),
        sa.Column("times_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("credits_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_redeemed_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_referrals_candidate_id", "referrals", ["candidate_id"], unique=False)
    op.create_index("ix_referrals_referral_code", "referrals", ["referral_code"], unique=True)
    op.create_index("ix_referrals_paddle_discount_id", "referrals", ["paddle_discount_id"], unique=False)

    op.create_table(
        "referral_redemptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("referral_id", sa.Integer(), sa.ForeignKey("referrals.id"), nullable=False),
        sa.Column("redeemer_order_session_id", sa.String(length=128)),
        sa.Column("redeemer_email", sa.String(length=255)),
        sa.Column("paddle_transaction_id", sa.String(length=128)),
        sa.Column("reward_status", sa.String(length=64)),
        sa.Column("reward_discount_id", sa.String(length=128)),
        sa.Column("reward_discount_code", sa.String(length=64)),
        sa.Column("reward_expires_at", sa.DateTime()),
        sa.Column("reward_email_sent_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_referral_redemptions_referral_id", "referral_redemptions", ["referral_id"], unique=False)
    op.create_index("ix_referral_redemptions_redeemer_order_session_id", "referral_redemptions", ["redeemer_order_session_id"], unique=False)
    op.create_index("ix_referral_redemptions_redeemer_email", "referral_redemptions", ["redeemer_email"], unique=False)
    op.create_index("ix_referral_redemptions_paddle_transaction_id", "referral_redemptions", ["paddle_transaction_id"], unique=False)

    op.create_table(
        "notifications_sent",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), nullable=False),
        sa.Column("notification_type", sa.String(length=64), nullable=False),
        sa.Column("job_id", sa.String(length=128)),
        sa.Column("order_session_id", sa.String(length=128)),
        sa.Column("ses_message_id", sa.String(length=255)),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="queued"),
        sa.Column("sent_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_notifications_sent_candidate_id", "notifications_sent", ["candidate_id"], unique=False)
    op.create_index("ix_notifications_sent_notification_type", "notifications_sent", ["notification_type"], unique=False)
    op.create_index("ix_notifications_sent_job_id", "notifications_sent", ["job_id"], unique=False)
    op.create_index("ix_notifications_sent_order_session_id", "notifications_sent", ["order_session_id"], unique=False)

    op.create_table(
        "email_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id")),
        sa.Column("order_session_id", sa.String(length=128)),
        sa.Column("template_id", sa.String(length=128), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("ses_message_id", sa.String(length=255)),
        sa.Column("status", sa.String(length=64), nullable=False, server_default="queued"),
        sa.Column("provider_payload_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("sent_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_email_log_candidate_id", "email_log", ["candidate_id"], unique=False)
    op.create_index("ix_email_log_order_session_id", "email_log", ["order_session_id"], unique=False)
    op.create_index("ix_email_log_template_id", "email_log", ["template_id"], unique=False)
    op.create_index("ix_email_log_recipient", "email_log", ["recipient"], unique=False)

    op.create_table(
        "paddle_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=False),
        sa.Column("transaction_id", sa.String(length=128)),
        sa.Column("processing_status", sa.String(length=64), nullable=False, server_default="received"),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("processed_at", sa.DateTime()),
        sa.Column("error_message", sa.Text()),
    )
    op.create_index("ix_paddle_events_event_id", "paddle_events", ["event_id"], unique=True)
    op.create_index("ix_paddle_events_event_type", "paddle_events", ["event_type"], unique=False)
    op.create_index("ix_paddle_events_transaction_id", "paddle_events", ["transaction_id"], unique=False)

    op.create_table(
        "role_notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), nullable=False),
        sa.Column("job_id", sa.String(length=128), nullable=False),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("response_status", sa.String(length=64)),
        sa.Column("responded_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_role_notifications_candidate_id", "role_notifications", ["candidate_id"], unique=False)
    op.create_index("ix_role_notifications_job_id", "role_notifications", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_role_notifications_job_id", table_name="role_notifications")
    op.drop_index("ix_role_notifications_candidate_id", table_name="role_notifications")
    op.drop_table("role_notifications")

    op.drop_index("ix_paddle_events_transaction_id", table_name="paddle_events")
    op.drop_index("ix_paddle_events_event_type", table_name="paddle_events")
    op.drop_index("ix_paddle_events_event_id", table_name="paddle_events")
    op.drop_table("paddle_events")

    op.drop_index("ix_email_log_recipient", table_name="email_log")
    op.drop_index("ix_email_log_template_id", table_name="email_log")
    op.drop_index("ix_email_log_order_session_id", table_name="email_log")
    op.drop_index("ix_email_log_candidate_id", table_name="email_log")
    op.drop_table("email_log")

    op.drop_index("ix_notifications_sent_order_session_id", table_name="notifications_sent")
    op.drop_index("ix_notifications_sent_job_id", table_name="notifications_sent")
    op.drop_index("ix_notifications_sent_notification_type", table_name="notifications_sent")
    op.drop_index("ix_notifications_sent_candidate_id", table_name="notifications_sent")
    op.drop_table("notifications_sent")

    op.drop_index("ix_referral_redemptions_paddle_transaction_id", table_name="referral_redemptions")
    op.drop_index("ix_referral_redemptions_redeemer_email", table_name="referral_redemptions")
    op.drop_index("ix_referral_redemptions_redeemer_order_session_id", table_name="referral_redemptions")
    op.drop_index("ix_referral_redemptions_referral_id", table_name="referral_redemptions")
    op.drop_table("referral_redemptions")

    op.drop_index("ix_referrals_paddle_discount_id", table_name="referrals")
    op.drop_index("ix_referrals_referral_code", table_name="referrals")
    op.drop_index("ix_referrals_candidate_id", table_name="referrals")
    op.drop_table("referrals")

    op.drop_index("ix_candidate_sessions_session_token_hash", table_name="candidate_sessions")
    op.drop_index("ix_candidate_sessions_magic_token_hash", table_name="candidate_sessions")
    op.drop_index("ix_candidate_sessions_email", table_name="candidate_sessions")
    op.drop_index("ix_candidate_sessions_candidate_id", table_name="candidate_sessions")
    op.drop_table("candidate_sessions")

    op.drop_table("candidate_profiles")

    op.drop_index("ix_candidates_qdrant_point_id", table_name="candidates")
    op.drop_index("ix_candidates_opencats_candidate_id", table_name="candidates")
    op.drop_index("ix_candidates_order_session_id", table_name="candidates")
    op.drop_index("ix_candidates_email", table_name="candidates")
    op.drop_table("candidates")

    op.drop_index("ix_orders_customer_email", table_name="orders")
    op.drop_index("ix_orders_session_id", table_name="orders")
    op.drop_table("orders")
