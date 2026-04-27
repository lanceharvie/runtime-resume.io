from __future__ import annotations

from dataclasses import dataclass

from app.config import get_settings

DATA_ITEM_CANDIDATE = 100
EXTRA_FIELD_TEXT = 1
EXTRA_FIELD_TEXTAREA = 2

_TEXTAREA_FIELDS = {
    "rr_target_roles",
    "rr_target_locations",
    "rr_role_types",
    "rr_target_companies",
    "rr_key_achievements",
    "rr_concerns",
}


@dataclass
class OpenCATSCandidateSyncResult:
    status: str
    candidate_id: str | None = None
    message: str | None = None


def _clean(value: object | None) -> str:
    return str(value or "").strip()


def _bool_string(value: object) -> str:
    return "1" if bool(value) else "0"


def _split_name(full_name: str, email: str) -> tuple[str, str]:
    normalized = _clean(full_name)
    if normalized:
        parts = normalized.split()
        if len(parts) == 1:
            return parts[0], ""
        return parts[0], " ".join(parts[1:])
    fallback = _clean(email).split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    if not fallback:
        return "Unknown", "Candidate"
    parts = fallback.split()
    if len(parts) == 1:
        return parts[0].title(), ""
    return parts[0].title(), " ".join(part.title() for part in parts[1:])

class OpenCATSService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _configured(self) -> bool:
        return all(
            [
                self.settings.opencats_db_host,
                self.settings.opencats_db_user,
                self.settings.opencats_db_password,
                self.settings.opencats_db_name,
            ]
        )

    def _connect(self):
        import pymysql
        import pymysql.cursors

        return pymysql.connect(
            host=self.settings.opencats_db_host,
            port=self.settings.opencats_db_port,
            user=self.settings.opencats_db_user,
            password=self.settings.opencats_db_password,
            database=self.settings.opencats_db_name,
            charset="utf8mb4",
            autocommit=False,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10,
            read_timeout=30,
            write_timeout=30,
        )

    def _find_candidate_id(self, cur, email: str, linkedin_url: str) -> int | None:
        if email:
            cur.execute(
                """
                SELECT candidate_id
                FROM candidate
                WHERE site_id = %s
                  AND (
                    LOWER(COALESCE(email1, '')) = LOWER(%s)
                    OR LOWER(COALESCE(email2, '')) = LOWER(%s)
                  )
                ORDER BY candidate_id DESC
                LIMIT 1
                """,
                (self.settings.opencats_site_id, email, email),
            )
            row = cur.fetchone()
            if row:
                return int(row["candidate_id"])

        if linkedin_url:
            cur.execute(
                """
                SELECT c.candidate_id
                FROM candidate c
                WHERE c.site_id = %s
                  AND COALESCE(c.web_site, '') = %s
                ORDER BY c.candidate_id DESC
                LIMIT 1
                """,
                (self.settings.opencats_site_id, linkedin_url),
            )
            row = cur.fetchone()
            if row:
                return int(row["candidate_id"])

            cur.execute(
                """
                SELECT data_item_id AS candidate_id
                FROM extra_field
                WHERE site_id = %s
                  AND data_item_type = %s
                  AND field_name = 'Linkedin'
                  AND value = %s
                ORDER BY extra_field_id DESC
                LIMIT 1
                """,
                (self.settings.opencats_site_id, DATA_ITEM_CANDIDATE, linkedin_url),
            )
            row = cur.fetchone()
            if row:
                return int(row["candidate_id"])

        return None

    def _ensure_extra_field_definition(self, cur, field_name: str, field_type: int) -> None:
        cur.execute(
            """
            SELECT extra_field_settings_id
            FROM extra_field_settings
            WHERE field_name = %s
              AND site_id = %s
              AND data_item_type = %s
            LIMIT 1
            """,
            (field_name, self.settings.opencats_site_id, DATA_ITEM_CANDIDATE),
        )
        row = cur.fetchone()
        if row:
            return

        cur.execute(
            """
            INSERT INTO extra_field_settings (
                field_name,
                site_id,
                date_created,
                data_item_type,
                extra_field_type
            )
            VALUES (%s, %s, NOW(), %s, %s)
            """,
            (field_name, self.settings.opencats_site_id, DATA_ITEM_CANDIDATE, field_type),
        )
        settings_id = cur.lastrowid
        cur.execute(
            """
            UPDATE extra_field_settings
            SET position = %s
            WHERE extra_field_settings_id = %s
              AND site_id = %s
            """,
            (settings_id, settings_id, self.settings.opencats_site_id),
        )

    def _set_custom_field(self, cur, candidate_id: int, field_name: str, value: str) -> None:
        field_type = EXTRA_FIELD_TEXTAREA if field_name in _TEXTAREA_FIELDS else EXTRA_FIELD_TEXT
        self._ensure_extra_field_definition(cur, field_name, field_type)
        cur.execute(
            """
            DELETE FROM extra_field
            WHERE field_name = %s
              AND data_item_id = %s
              AND site_id = %s
              AND data_item_type = %s
            """,
            (field_name, candidate_id, self.settings.opencats_site_id, DATA_ITEM_CANDIDATE),
        )
        if value == "":
            return
        cur.execute(
            """
            INSERT INTO extra_field (
                data_item_id,
                field_name,
                value,
                import_id,
                site_id,
                data_item_type
            )
            VALUES (%s, %s, %s, 0, %s, %s)
            """,
            (candidate_id, field_name, value, self.settings.opencats_site_id, DATA_ITEM_CANDIDATE),
        )

    def upsert_candidate(self, payload: dict) -> dict:
        if not self._configured():
            return OpenCATSCandidateSyncResult(
                status="skipped",
                message="OpenCATS database settings are not configured.",
            ).__dict__

        email = _clean(payload.get("email"))
        linkedin_url = _clean(payload.get("linkedin_url"))
        first_name, last_name = _split_name(_clean(payload.get("full_name")), email)
        source = _clean(payload.get("source")) or "runtimeresume"
        custom_fields = {
            "Linkedin": linkedin_url,
            "rr_source": source,
            "rr_order_session_id": _clean(payload.get("order_session_id")),
            "rr_job_seek_status": _clean(payload.get("job_seek_status")),
            "rr_open_to_representation": _bool_string(payload.get("open_to_representation")),
            "rr_target_roles": _clean(payload.get("target_roles")),
            "rr_target_locations": _clean(payload.get("target_locations")),
            "rr_salary_range": _clean(payload.get("salary_range")),
            "rr_role_types": _clean(payload.get("role_types")),
            "rr_years_experience": _clean(payload.get("years_experience")),
            "rr_geographic_preference": _clean(payload.get("geographic_preference")),
            "rr_target_companies": _clean(payload.get("target_companies")),
            "rr_key_achievements": _clean(payload.get("key_achievements")),
            "rr_concerns": _clean(payload.get("concerns")),
            "rr_relocation_flag": _bool_string(payload.get("relocation_flag")),
        }

        try:
            with self._connect() as conn:
                with conn.cursor() as cur:
                    candidate_id = self._find_candidate_id(cur, email, linkedin_url)
                    status = "updated"

                    if candidate_id is None:
                        cur.execute(
                            """
                            INSERT INTO candidate (
                                site_id,
                                first_name,
                                last_name,
                                email1,
                                web_site,
                                source,
                                can_relocate,
                                entered_by,
                                owner,
                                date_created,
                                date_modified
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                            """,
                            (
                                self.settings.opencats_site_id,
                                first_name,
                                last_name,
                                email,
                                linkedin_url,
                                source,
                                1 if payload.get("relocation_flag") else 0,
                                self.settings.opencats_system_user_id,
                                self.settings.opencats_system_user_id,
                            ),
                        )
                        candidate_id = int(cur.lastrowid)
                        status = "created"
                    else:
                        cur.execute(
                            """
                            UPDATE candidate
                            SET first_name = %s,
                                last_name = %s,
                                email1 = %s,
                                web_site = %s,
                                source = %s,
                                can_relocate = %s,
                                date_modified = NOW()
                            WHERE candidate_id = %s
                              AND site_id = %s
                            """,
                            (
                                first_name,
                                last_name,
                                email,
                                linkedin_url,
                                source,
                                1 if payload.get("relocation_flag") else 0,
                                candidate_id,
                                self.settings.opencats_site_id,
                            ),
                        )

                    for field_name, value in custom_fields.items():
                        self._set_custom_field(cur, candidate_id, field_name, value)

                conn.commit()
        except Exception as exc:
            return OpenCATSCandidateSyncResult(status="error", message=str(exc)).__dict__

        return OpenCATSCandidateSyncResult(
            status=status,
            candidate_id=str(candidate_id),
            message=f"Candidate {status} in OpenCATS.",
        ).__dict__

    def record_role_notification_response(self, candidate_id: str | None, job_id: str, response_status: str) -> dict:
        if not self._configured():
            return {"status": "skipped", "message": "OpenCATS database settings are not configured."}
        if not candidate_id:
            return {"status": "skipped", "message": "No OpenCATS candidate id provided."}

        try:
            with self._connect() as conn:
                with conn.cursor() as cur:
                    numeric_candidate_id = int(candidate_id)
                    self._set_custom_field(cur, numeric_candidate_id, "rr_last_role_notification_job_id", _clean(job_id))
                    self._set_custom_field(cur, numeric_candidate_id, "rr_last_role_notification_response", _clean(response_status))
                conn.commit()
        except Exception as exc:
            return {"status": "error", "message": str(exc)}

        return {"status": "updated", "message": "Role notification response recorded in OpenCATS."}
