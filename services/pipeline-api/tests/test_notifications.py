from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models.domain import Candidate
from app.models.domain import NotificationSent
from app.models.domain import RoleNotification
from app.services.email import EmailService
from app.services.notifications import NotificationService
from app.services.opencats import OpenCATSService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return session_factory()


def fake_settings():
    return SimpleNamespace(
        notification_rate_limit_days=7,
        ses_from_email="",
        ses_reply_to="",
        aws_region="ap-southeast-2",
    )


def test_create_role_notification_and_record_response(monkeypatch):
    session = make_session()
    candidate = Candidate(
        email="candidate@example.com",
        full_name="Candidate Example",
        source="runtimeresume",
        job_seek_status="open_to_opportunities",
        open_to_representation=True,
        opencats_candidate_id="123",
    )
    session.add(candidate)
    session.commit()

    monkeypatch.setattr("app.services.notifications.get_settings", fake_settings)
    monkeypatch.setattr(
        EmailService,
        "send_role_match_email",
        lambda self, session, settings, candidate, **kwargs: {"delivery_mode": "preview"},
    )
    recorded = {}
    monkeypatch.setattr(
        OpenCATSService,
        "record_role_notification_response",
        lambda self, candidate_id, job_id, response_status: recorded.update({
            "candidate_id": candidate_id,
            "job_id": job_id,
            "response_status": response_status,
        }) or {"status": "updated"},
    )

    service = NotificationService()
    created = service.create_role_notification(
        session=session,
        candidate=candidate,
        job_id="job-1",
        match_score=0.91,
        title="Senior Recruiter",
        company="RunTime Recruitment",
        location="Sydney",
        url="https://example.com/jobs/job-1",
        summary="Relevant role summary.",
    )
    session.commit()

    notification = session.query(RoleNotification).one()
    sent = session.query(NotificationSent).one()

    assert created["status"] == "preview_only"
    assert notification.job_id == "job-1"
    assert sent.notification_type == "role_match"

    updated = service.record_response(session, candidate, notification.id, "interested")
    session.commit()

    assert updated.response_status == "interested"
    assert recorded == {
        "candidate_id": "123",
        "job_id": "job-1",
        "response_status": "interested",
    }


def test_create_role_notification_respects_candidate_eligibility(monkeypatch):
    session = make_session()
    candidate = Candidate(
        email="candidate2@example.com",
        full_name="Candidate Two",
        source="runtimeresume",
        job_seek_status="not_seeking",
        open_to_representation=False,
    )
    session.add(candidate)
    session.commit()

    monkeypatch.setattr("app.services.notifications.get_settings", fake_settings)

    result = NotificationService().create_role_notification(
        session=session,
        candidate=candidate,
        job_id="job-2",
        match_score=0.77,
        title="Ops Lead",
        company="RunTime Recruitment",
        location="Remote",
        url="https://example.com/jobs/job-2",
        summary="",
    )

    assert result["status"] == "skipped"
    assert result["reason"] == "representation_disabled"
