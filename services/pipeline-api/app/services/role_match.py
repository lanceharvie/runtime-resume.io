from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.domain import Candidate
from app.services.notifications import NotificationService


def _tokenize(value: str | None) -> set[str]:
    if not value:
        return set()
    normalized = value.lower()
    for token in [",", "/", "|", ";", "(", ")", ".", ":"]:
        normalized = normalized.replace(token, " ")
    return {part.strip() for part in normalized.split() if part.strip()}


def _overlap_score(candidate_value: str | None, job_value: str | None) -> float:
    candidate_tokens = _tokenize(candidate_value)
    job_tokens = _tokenize(job_value)
    if not candidate_tokens or not job_tokens:
        return 0.0
    overlap = candidate_tokens & job_tokens
    return len(overlap) / max(len(job_tokens), 1)


@dataclass
class JobMatch:
    job_id: str
    title: str
    company: str
    location: str
    url: str
    summary: str
    role_type: str
    score: float


class RoleMatchService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _load_jobboard_feed(self) -> list[dict]:
        db_path = self.settings.role_match_jobboard_db_path
        if not db_path:
            return []

        path = Path(db_path)
        if not path.exists():
            return []

        query = """
            SELECT
                od.job_url,
                od.job_title,
                od.company_name,
                COALESCE(sc.location, '') AS location,
                COALESCE(sc.text, '') AS summary,
                ROW_NUMBER() OVER (
                    PARTITION BY od.job_url
                    ORDER BY od.match_score DESC, od.id DESC
                ) AS rn
            FROM outreach_drafts od
            LEFT JOIN scrape_cache sc ON sc.url = od.job_url
            WHERE COALESCE(od.job_url, '') != ''
              AND COALESCE(od.job_title, '') != ''
        """

        jobs = []
        with sqlite3.connect(str(path)) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query).fetchall()
        for row in rows:
            if row["rn"] != 1:
                continue
            jobs.append({
                "job_id": row["job_url"],
                "title": row["job_title"],
                "company": row["company_name"],
                "location": row["location"],
                "url": row["job_url"],
                "summary": row["summary"][:1200] if row["summary"] else "",
                "role_type": "",
            })
        return jobs

    def load_job_feed(self) -> list[dict]:
        jobboard_jobs = self._load_jobboard_feed()
        if jobboard_jobs:
            return jobboard_jobs

        if not self.settings.role_match_feed_path:
            return []

        feed_path = Path(self.settings.role_match_feed_path)
        if not feed_path.exists():
            return []

        payload = json.loads(feed_path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict) and isinstance(payload.get("jobs"), list):
            return [item for item in payload["jobs"] if isinstance(item, dict)]
        return []

    def score_candidate_for_job(self, candidate: Candidate, job: dict) -> float:
        title_score = _overlap_score(candidate.target_roles, job.get("title"))
        location_score = _overlap_score(
            " ".join(filter(None, [candidate.target_locations, candidate.geographic_preference])),
            job.get("location"),
        )
        role_type_score = _overlap_score(candidate.role_types, job.get("role_type"))
        weighted = (title_score * 0.65) + (location_score * 0.25) + (role_type_score * 0.10)

        if candidate.job_seek_status == "actively_looking":
            weighted += 0.05
        if candidate.relocation_flag and job.get("location"):
            weighted += 0.03
        return min(round(weighted, 4), 1.0)

    def find_matches_for_candidate(self, candidate: Candidate, jobs: list[dict]) -> list[JobMatch]:
        matches = []
        for job in jobs:
            job_id = str(job.get("job_id") or job.get("id") or "").strip()
            if not job_id:
                continue
            score = self.score_candidate_for_job(candidate, job)
            if score < self.settings.match_threshold:
                continue
            matches.append(
                JobMatch(
                    job_id=job_id,
                    title=str(job.get("title") or "").strip(),
                    company=str(job.get("company") or "").strip(),
                    location=str(job.get("location") or "").strip(),
                    url=str(job.get("url") or "").strip(),
                    summary=str(job.get("summary") or "").strip(),
                    role_type=str(job.get("role_type") or "").strip(),
                    score=score,
                )
            )

        matches.sort(key=lambda item: item.score, reverse=True)
        return matches[: self.settings.role_match_max_candidates_per_job]

    def run(self, session: Session) -> dict:
        jobs = self.load_job_feed()
        if not jobs:
            return {"ok": True, "jobs_scanned": 0, "notifications_created": 0}

        candidates = (
            session.query(Candidate)
            .filter(Candidate.source == "runtimeresume")
            .filter(Candidate.open_to_representation.is_(True))
            .filter(Candidate.job_seek_status != "not_seeking")
            .all()
        )

        notification_service = NotificationService()
        created = 0
        for candidate in candidates:
            matches = self.find_matches_for_candidate(candidate, jobs)
            for match in matches:
                result = notification_service.create_role_notification(
                    session=session,
                    candidate=candidate,
                    job_id=match.job_id,
                    match_score=match.score,
                    title=match.title,
                    company=match.company,
                    location=match.location,
                    url=match.url,
                    summary=match.summary,
                )
                if result.get("status") in {"sent", "preview_only"}:
                    created += 1

        session.commit()
        return {
            "ok": True,
            "jobs_scanned": len(jobs),
            "notifications_created": created,
        }
