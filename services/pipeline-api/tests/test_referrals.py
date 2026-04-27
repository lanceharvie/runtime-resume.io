from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models.domain import Candidate
from app.models.domain import Order
from app.models.domain import ReferralRedemption
from app.services.email import EmailService
from app.services.referrals import ReferralService
from app.services.stripe import StripeService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return session_factory()


def fake_settings(stripe_secret_key="test-key"):
    return SimpleNamespace(
        frontend_base_url="http://localhost:3000",
        stripe_secret_key=stripe_secret_key,
        stripe_webhook_secret="whsec_test",
        ses_from_email="",
        ses_reply_to="",
        aws_region="ap-southeast-2",
    )


def seed_candidate_and_order(session, email="candidate@example.com"):
    order = Order(session_id="rr_test_123", tier="full-rewrite", customer_email=email)
    candidate = Candidate(
        order_session_id=order.session_id,
        email=email,
        full_name="Test Candidate",
        open_to_representation=True,
    )
    session.add(order)
    session.add(candidate)
    session.commit()
    return candidate, order


def test_get_or_create_referral_creates_discount_and_lookup_is_normalized(monkeypatch):
    session = make_session()
    candidate, _order = seed_candidate_and_order(session)

    monkeypatch.setattr("app.services.referrals.get_settings", lambda: fake_settings())
    monkeypatch.setattr(
        StripeService,
        "create_promotion_code",
        lambda self, **kwargs: {"id": "promo_customer_1", "code": kwargs["code"]},
    )

    service = ReferralService()
    referral = service.get_or_create_for_candidate(session, candidate.id)
    looked_up = service.get_checkout_referral(session, referral.referral_code.replace("RT", "RT-"))

    assert referral.referral_code.startswith("RT")
    assert referral.checkout_promotion_code_id == "promo_customer_1"
    assert referral.referral_link.endswith(f"/order?ref={referral.referral_code}")
    assert looked_up is not None
    assert looked_up.id == referral.id


def test_process_referral_redemption_is_idempotent(monkeypatch):
    session = make_session()
    candidate, order = seed_candidate_and_order(session, email="referrer@example.com")

    monkeypatch.setattr("app.services.referrals.get_settings", lambda: fake_settings())
    monkeypatch.setattr(
        StripeService,
        "create_promotion_code",
        lambda self, **kwargs: {"id": f"promo_{kwargs['code']}", "code": kwargs["code"]},
    )
    monkeypatch.setattr(
        EmailService,
        "send_referral_reward_email",
        lambda self, session, settings, candidate, redemption: {"delivery_mode": "preview"},
    )

    service = ReferralService()
    referral = service.get_or_create_for_candidate(session, candidate.id)
    event = {
        "data": {
            "object": {
                "id": "cs_test_123",
                "status": "complete",
                "payment_status": "paid",
                "customer_details": {
                    "email": "redeemer@example.com",
                },
                "metadata": {
                    "session_id": "rr_redeemer_1",
                    "referral_code": referral.referral_code,
                },
            },
        },
        "type": "checkout.session.completed",
    }

    first = service.process_referral_redemption(session, order, event)
    session.commit()
    second = service.process_referral_redemption(session, order, event)
    session.commit()

    rows = session.query(ReferralRedemption).all()
    session.refresh(referral)

    assert first is not None
    assert second is not None
    assert first.id == second.id
    assert len(rows) == 1
    assert referral.times_used == 1
    assert referral.credits_earned == 30
    assert rows[0].reward_status == "reward_sent"
    assert rows[0].reward_discount_code.startswith("RTR")


def test_process_referral_redemption_blocks_self_referrals(monkeypatch):
    session = make_session()
    candidate, order = seed_candidate_and_order(session, email="self@example.com")

    monkeypatch.setattr("app.services.referrals.get_settings", lambda: fake_settings())
    monkeypatch.setattr(
        StripeService,
        "create_promotion_code",
        lambda self, **kwargs: {"id": f"promo_{kwargs['code']}", "code": kwargs["code"]},
    )

    service = ReferralService()
    referral = service.get_or_create_for_candidate(session, candidate.id)
    event = {
        "data": {
            "object": {
                "id": "cs_test_self_1",
                "status": "complete",
                "payment_status": "paid",
                "customer_details": {
                    "email": "self@example.com",
                },
                "metadata": {
                    "session_id": "rr_self_1",
                    "referral_code": referral.referral_code,
                },
            },
        },
        "type": "checkout.session.completed",
    }

    redemption = service.process_referral_redemption(session, order, event)
    session.commit()
    session.refresh(referral)

    assert redemption is not None
    assert redemption.reward_status == "self_referral_blocked"
    assert referral.times_used == 0
    assert referral.credits_earned == 0
