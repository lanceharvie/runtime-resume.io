import json
from pathlib import Path
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models.domain import Candidate
from app.models.domain import NotificationSent
from app.models.domain import RoleNotification
from app.services.email import EmailService
from app.services.role_match import RoleMatchService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    return session_factory()


def test_role_match_service_creates_notifications_from_feed(monkeypatch, tmp_path: Path):
    feed_path = tmp_path / "jobs.json"
    feed_path.write_text(json.dumps([
        {
            "job_id": "job-123",
            "title": "Senior Recruiter",
            "company": "RunTime Recruitment",
            "location": "Sydney",
            "url": "https://example.com/jobs/job-123",
            "summary": "High-fit recruiter role.",
            "role_type": "full-time",
        },
        {
            "job_id": "job-456",
            "title": "Finance Manager",
            "company": "Another Company",
            "location": "Melbourne",
            "url": "https://example.com/jobs/job-456",
            "summary": "Low-fit role.",
            "role_type": "full-time",
        },
    ]), encoding="utf-8")

    session = make_session()
    candidate = Candidate(
        email="match@example.com",
        full_name="Recruiter Candidate",
        source="runtimeresume",
        job_seek_status="actively_looking",
        open_to_representation=True,
        target_roles="Senior Recruiter Talent Acquisition",
        target_locations="Sydney",
        role_types="full-time",
    )
    session.add(candidate)
    session.commit()

    monkeypatch.setattr(
        "app.services.role_match.get_settings",
        lambda: SimpleNamespace(
            role_match_jobboard_db_path="",
            role_match_feed_path=str(feed_path),
            match_threshold=0.5,
            role_match_max_candidates_per_job=10,
            notification_rate_limit_days=7,
            ses_from_email="",
            ses_reply_to="",
            aws_region="ap-southeast-2",
        ),
    )
    monkeypatch.setattr(
        "app.services.notifications.get_settings",
        lambda: SimpleNamespace(
            notification_rate_limit_days=7,
            ses_from_email="",
            ses_reply_to="",
            aws_region="ap-southeast-2",
        ),
    )
    monkeypatch.setattr(
        EmailService,
        "send_role_match_email",
        lambda self, session, settings, candidate, **kwargs: {"delivery_mode": "preview"},
    )

    result = RoleMatchService().run(session)

    assert result["ok"] is True
    assert result["jobs_scanned"] == 2
    assert result["notifications_created"] == 1
    assert session.query(RoleNotification).count() == 1
    assert session.query(NotificationSent).count() == 1


def test_role_match_service_loads_jobs_from_jobboard_db(monkeypatch, tmp_path: Path):
    db_path = tmp_path / "jobboard.db"
    conn = __import__("sqlite3").connect(db_path)
    try:
        conn.execute("create table outreach_drafts (id integer primary key, job_url text, job_title text, company_name text, match_score real)")
        conn.execute("create table scrape_cache (url text primary key, html text, text text, job_title text, company text, location text, cached_at text)")
        conn.execute(
            "insert into outreach_drafts (id, job_url, job_title, company_name, match_score) values (1, ?, ?, ?, ?)",
            ("https://example.com/job-1", "Senior Recruiter", "RunTime Recruitment", 0.9),
        )
        conn.execute(
            "insert into scrape_cache (url, text, location) values (?, ?, ?)",
            ("https://example.com/job-1", "Full recruiter summary", "Sydney"),
        )
        conn.commit()
    finally:
        conn.close()

    monkeypatch.setattr(
        "app.services.role_match.get_settings",
        lambda: SimpleNamespace(
            role_match_jobboard_db_path=str(db_path),
            role_match_feed_path="",
            match_threshold=0.5,
            role_match_max_candidates_per_job=10,
            notification_rate_limit_days=7,
            ses_from_email="",
            ses_reply_to="",
            aws_region="ap-southeast-2",
        ),
    )

    jobs = RoleMatchService().load_job_feed()

    assert len(jobs) == 1
    assert jobs[0]["job_id"] == "https://example.com/job-1"
    assert jobs[0]["title"] == "Senior Recruiter"
    assert jobs[0]["company"] == "RunTime Recruitment"
