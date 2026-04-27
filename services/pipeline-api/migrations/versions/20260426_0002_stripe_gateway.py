"""Rename payment schema from Paddle to Stripe

Revision ID: 20260426_0002
Revises: 20260405_0001
Create Date: 2026-04-26 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260426_0002"
down_revision = "20260405_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    with op.batch_alter_table("orders") as batch_op:
        if "paddle_transaction_id" in order_columns and "stripe_checkout_id" not in order_columns:
            batch_op.alter_column("paddle_transaction_id", new_column_name="stripe_checkout_id")
        if "paddle_customer_id" in order_columns and "stripe_customer_id" not in order_columns:
            batch_op.alter_column("paddle_customer_id", new_column_name="stripe_customer_id")

    referral_columns = {column["name"] for column in inspector.get_columns("referrals")}
    referral_indexes = {index["name"] for index in inspector.get_indexes("referrals")}
    with op.batch_alter_table("referrals") as batch_op:
        if "ix_referrals_paddle_discount_id" in referral_indexes:
            batch_op.drop_index("ix_referrals_paddle_discount_id")
        if "paddle_discount_id" in referral_columns and "checkout_promotion_code_id" not in referral_columns:
            batch_op.alter_column("paddle_discount_id", new_column_name="checkout_promotion_code_id")
    inspector = sa.inspect(bind)
    referral_indexes = {index["name"] for index in inspector.get_indexes("referrals")}
    if "ix_referrals_checkout_promotion_code_id" not in referral_indexes:
        op.create_index("ix_referrals_checkout_promotion_code_id", "referrals", ["checkout_promotion_code_id"], unique=False)

    redemption_columns = {column["name"] for column in inspector.get_columns("referral_redemptions")}
    redemption_indexes = {index["name"] for index in inspector.get_indexes("referral_redemptions")}
    with op.batch_alter_table("referral_redemptions") as batch_op:
        if "ix_referral_redemptions_paddle_transaction_id" in redemption_indexes:
            batch_op.drop_index("ix_referral_redemptions_paddle_transaction_id")
        if "paddle_transaction_id" in redemption_columns and "stripe_checkout_id" not in redemption_columns:
            batch_op.alter_column("paddle_transaction_id", new_column_name="stripe_checkout_id")
    inspector = sa.inspect(bind)
    redemption_indexes = {index["name"] for index in inspector.get_indexes("referral_redemptions")}
    if "ix_referral_redemptions_stripe_checkout_id" not in redemption_indexes:
        op.create_index("ix_referral_redemptions_stripe_checkout_id", "referral_redemptions", ["stripe_checkout_id"], unique=False)

    table_names = set(inspector.get_table_names())
    if "paddle_events" in table_names and "stripe_events" not in table_names:
        op.rename_table("paddle_events", "stripe_events")

    stripe_event_columns = {column["name"] for column in inspector.get_columns("stripe_events")}
    stripe_event_indexes = {index["name"] for index in inspector.get_indexes("stripe_events")}
    with op.batch_alter_table("stripe_events") as batch_op:
        if "ix_paddle_events_event_id" in stripe_event_indexes:
            batch_op.drop_index("ix_paddle_events_event_id")
        if "ix_paddle_events_event_type" in stripe_event_indexes:
            batch_op.drop_index("ix_paddle_events_event_type")
        if "ix_paddle_events_transaction_id" in stripe_event_indexes:
            batch_op.drop_index("ix_paddle_events_transaction_id")
        if "transaction_id" in stripe_event_columns and "checkout_id" not in stripe_event_columns:
            batch_op.alter_column("transaction_id", new_column_name="checkout_id")
    inspector = sa.inspect(bind)
    stripe_event_indexes = {index["name"] for index in inspector.get_indexes("stripe_events")}
    if "ix_stripe_events_event_id" not in stripe_event_indexes:
        op.create_index("ix_stripe_events_event_id", "stripe_events", ["event_id"], unique=True)
    if "ix_stripe_events_event_type" not in stripe_event_indexes:
        op.create_index("ix_stripe_events_event_type", "stripe_events", ["event_type"], unique=False)
    if "ix_stripe_events_checkout_id" not in stripe_event_indexes:
        op.create_index("ix_stripe_events_checkout_id", "stripe_events", ["checkout_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    stripe_event_indexes = {index["name"] for index in inspector.get_indexes("stripe_events")}
    stripe_event_columns = {column["name"] for column in inspector.get_columns("stripe_events")}
    with op.batch_alter_table("stripe_events") as batch_op:
        if "ix_stripe_events_checkout_id" in stripe_event_indexes:
            batch_op.drop_index("ix_stripe_events_checkout_id")
        if "ix_stripe_events_event_type" in stripe_event_indexes:
            batch_op.drop_index("ix_stripe_events_event_type")
        if "ix_stripe_events_event_id" in stripe_event_indexes:
            batch_op.drop_index("ix_stripe_events_event_id")
        if "checkout_id" in stripe_event_columns and "transaction_id" not in stripe_event_columns:
            batch_op.alter_column("checkout_id", new_column_name="transaction_id")
        batch_op.create_index("ix_paddle_events_event_id", ["event_id"], unique=True)
        batch_op.create_index("ix_paddle_events_event_type", ["event_type"], unique=False)
        batch_op.create_index("ix_paddle_events_transaction_id", ["transaction_id"], unique=False)

    table_names = set(inspector.get_table_names())
    if "stripe_events" in table_names and "paddle_events" not in table_names:
        op.rename_table("stripe_events", "paddle_events")

    redemption_indexes = {index["name"] for index in inspector.get_indexes("referral_redemptions")}
    redemption_columns = {column["name"] for column in inspector.get_columns("referral_redemptions")}
    with op.batch_alter_table("referral_redemptions") as batch_op:
        if "ix_referral_redemptions_stripe_checkout_id" in redemption_indexes:
            batch_op.drop_index("ix_referral_redemptions_stripe_checkout_id")
        if "stripe_checkout_id" in redemption_columns and "paddle_transaction_id" not in redemption_columns:
            batch_op.alter_column("stripe_checkout_id", new_column_name="paddle_transaction_id")
        batch_op.create_index("ix_referral_redemptions_paddle_transaction_id", ["paddle_transaction_id"], unique=False)

    referral_indexes = {index["name"] for index in inspector.get_indexes("referrals")}
    referral_columns = {column["name"] for column in inspector.get_columns("referrals")}
    with op.batch_alter_table("referrals") as batch_op:
        if "ix_referrals_checkout_promotion_code_id" in referral_indexes:
            batch_op.drop_index("ix_referrals_checkout_promotion_code_id")
        if "checkout_promotion_code_id" in referral_columns and "paddle_discount_id" not in referral_columns:
            batch_op.alter_column("checkout_promotion_code_id", new_column_name="paddle_discount_id")
        batch_op.create_index("ix_referrals_paddle_discount_id", ["paddle_discount_id"], unique=False)

    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    with op.batch_alter_table("orders") as batch_op:
        if "stripe_customer_id" in order_columns and "paddle_customer_id" not in order_columns:
            batch_op.alter_column("stripe_customer_id", new_column_name="paddle_customer_id")
        if "stripe_checkout_id" in order_columns and "paddle_transaction_id" not in order_columns:
            batch_op.alter_column("stripe_checkout_id", new_column_name="paddle_transaction_id")
