from datetime import timedelta
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models.domain import Candidate
from app.models.domain import Order
from app.services.email import EmailService
from app.services.referrals import ReferralService
from app.time import utc_now


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return session_factory()


def test_share_prompt_job(monkeypatch):
    from app.jobs import share_prompt

    session = make_session()
    order = Order(
        session_id="order-1",
        tier="full-rewrite",
        customer_email="share@example.com",
        customer_name="Share User",
        delivered_at=utc_now() - timedelta(hours=30),
        share_prompt_status="pending",
    )
    session.add(order)
    session.commit()

    monkeypatch.setattr(share_prompt, "SessionLocal", lambda: session)
    monkeypatch.setattr(
        share_prompt,
        "get_settings",
        lambda: SimpleNamespace(share_prompt_delay_hours=24, frontend_base_url="http://localhost:3000", ses_from_email="", ses_reply_to="", aws_region="ap-southeast-2"),
    )
    monkeypatch.setattr(
        EmailService,
        "send_share_prompt_email",
        lambda self, session, settings, **kwargs: {"delivery_mode": "preview"},
    )

    result = share_prompt.run_share_prompt_job()
    refreshed = sessionmaker(bind=session.bind, autoflush=False, autocommit=False, future=True)()
    try:
        order = refreshed.query(Order).filter(Order.session_id == "order-1").one()
        assert result["share_prompts_sent"] == 1
        assert order.share_prompt_status == "sent"
    finally:
        refreshed.close()


def test_refresh_offer_job(monkeypatch):
    from app.jobs import refresh_offer

    session = make_session()
    order = Order(
        session_id="order-2",
        tier="full-rewrite",
        customer_email="refresh@example.com",
        customer_name="Refresh User",
        delivered_at=utc_now() - timedelta(days=336),
        refresh_email_sent=False,
    )
    session.add(order)
    session.commit()

    monkeypatch.setattr(refresh_offer, "SessionLocal", lambda: session)
    monkeypatch.setattr(
        refresh_offer,
        "get_settings",
        lambda: SimpleNamespace(refresh_offer_min_days=335, refresh_offer_max_days=337, frontend_base_url="http://localhost:3000", ses_from_email="", ses_reply_to="", aws_region="ap-southeast-2"),
    )
    monkeypatch.setattr(
        EmailService,
        "send_refresh_offer_email",
        lambda self, session, settings, **kwargs: {"delivery_mode": "preview"},
    )

    result = refresh_offer.run_refresh_offer_job()
    refreshed = sessionmaker(bind=session.bind, autoflush=False, autocommit=False, future=True)()
    try:
        order = refreshed.query(Order).filter(Order.session_id == "order-2").one()
        assert result["refresh_offers_sent"] == 1
        assert order.refresh_email_sent is True
    finally:
        refreshed.close()


def test_placed_followup_job(monkeypatch, tmp_path):
    from app.jobs import placed_followup

    session = make_session()
    candidate = Candidate(
        email="placed@example.com",
        full_name="Placed User",
        source="runtimeresume",
        open_to_representation=True,
        order_session_id="order-3",
    )
    session.add(candidate)
    session.commit()

    feed_path = tmp_path / "placed.json"
    feed_path.write_text('{"placements":[{"email":"placed@example.com"}]}', encoding="utf-8")

    monkeypatch.setattr(placed_followup, "SessionLocal", lambda: session)
    monkeypatch.setattr(
        placed_followup,
        "get_settings",
        lambda: SimpleNamespace(placed_followup_feed_path=str(feed_path), frontend_base_url="http://localhost:3000", stripe_secret_key="", ses_from_email="", ses_reply_to="", aws_region="ap-southeast-2"),
    )
    monkeypatch.setattr(
        EmailService,
        "send_placed_followup_email",
        lambda self, session, settings, **kwargs: {"delivery_mode": "preview"},
    )
    monkeypatch.setattr(
        ReferralService,
        "get_or_create_for_candidate",
        lambda self, session, candidate_id: SimpleNamespace(referral_code="RTTEST1", referral_link="http://localhost:3000/order?ref=RTTEST1"),
    )

    result = placed_followup.run_placed_followup_job()

    assert result["placed_followups_sent"] == 1
