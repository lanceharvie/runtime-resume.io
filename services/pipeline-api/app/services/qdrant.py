from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha1

from app.config import get_settings


@dataclass
class QdrantSyncResult:
    status: str
    point_id: str | None = None
    message: str | None = None
    source: str | None = None


def _clean(value: object | None) -> str:
    return str(value or "").strip()


def _bool(value: object) -> bool:
    return bool(value)

class QdrantService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client

        from qdrant_client import QdrantClient

        self._client = QdrantClient(
            host=self.settings.qdrant_host,
            port=self.settings.qdrant_port,
            timeout=self.settings.qdrant_timeout_seconds,
        )
        return self._client

    def _build_payload(self, payload: dict) -> dict:
        return {
            "pipeline_candidate_id": payload.get("pipeline_candidate_id"),
            "opencats_candidate_id": _clean(payload.get("opencats_candidate_id")),
            "order_session_id": _clean(payload.get("order_session_id")),
            "source": _clean(payload.get("source")) or "runtimeresume",
            "email": _clean(payload.get("email")),
            "candidate_email": _clean(payload.get("email")),
            "full_name": _clean(payload.get("full_name")),
            "linkedin_url": _clean(payload.get("linkedin_url")),
            "job_seek_status": _clean(payload.get("job_seek_status")),
            "open_to_representation": _bool(payload.get("open_to_representation")),
            "target_roles": _clean(payload.get("target_roles")),
            "target_locations": _clean(payload.get("target_locations")),
            "salary_range": _clean(payload.get("salary_range")),
            "role_types": _clean(payload.get("role_types")),
            "geographic_preference": _clean(payload.get("geographic_preference")),
            "relocation_flag": _bool(payload.get("relocation_flag")),
            "years_experience": _clean(payload.get("years_experience")),
            "target_companies": _clean(payload.get("target_companies")),
            "key_achievements": _clean(payload.get("key_achievements")),
            "concerns": _clean(payload.get("concerns")),
        }

    def _candidate_point_id(self, payload: dict) -> int | str:
        existing_point_id = payload.get("qdrant_point_id")
        if isinstance(existing_point_id, int):
            return existing_point_id
        if isinstance(existing_point_id, str) and existing_point_id.isdigit():
            return int(existing_point_id)

        opencats_candidate_id = _clean(payload.get("opencats_candidate_id"))
        if opencats_candidate_id.isdigit():
            return int(opencats_candidate_id)

        pipeline_candidate_id = payload.get("pipeline_candidate_id")
        if isinstance(pipeline_candidate_id, int):
            return pipeline_candidate_id

        email = _clean(payload.get("email"))
        if email:
            return f"rr-{sha1(email.encode('utf-8')).hexdigest()[:16]}"

        return f"rr-{sha1(repr(sorted(payload.items())).encode('utf-8')).hexdigest()[:16]}"

    def _find_existing_point_id(self, client, payload: dict):
        from qdrant_client import models as qdrant_models

        checks = [
            ("pipeline_candidate_id", payload.get("pipeline_candidate_id")),
            ("opencats_candidate_id", _clean(payload.get("opencats_candidate_id"))),
            ("linkedin_url", _clean(payload.get("linkedin_url"))),
            ("candidate_email", _clean(payload.get("email"))),
            ("email", _clean(payload.get("email"))),
        ]
        for key, value in checks:
            if value in ("", None):
                continue
            records, _ = client.scroll(
                collection_name=self.settings.qdrant_collection,
                scroll_filter=qdrant_models.Filter(
                    must=[
                        qdrant_models.FieldCondition(
                            key=key,
                            match=qdrant_models.MatchValue(value=value),
                        )
                    ]
                ),
                limit=1,
                with_payload=False,
                with_vectors=False,
            )
            if records:
                return records[0].id
        return None

    def _empty_vector(self, client):
        info = client.get_collection(self.settings.qdrant_collection)
        vector_config = getattr(getattr(info, "config", None), "params", None)
        vector_config = getattr(vector_config, "vectors", None)

        if isinstance(vector_config, dict):
            vector_name, params = next(iter(vector_config.items()))
            return vector_name, [0.0] * int(params.size)
        if hasattr(vector_config, "size"):
            return None, [0.0] * int(vector_config.size)
        return None, [0.0]

    def upsert_candidate_payload(self, payload: dict) -> dict:
        normalized_payload = self._build_payload(payload)
        try:
            client = self._get_client()
            existing_point_id = self._find_existing_point_id(client, normalized_payload)

            if existing_point_id is not None:
                client.set_payload(
                    collection_name=self.settings.qdrant_collection,
                    payload=normalized_payload,
                    points=[existing_point_id],
                )
                return QdrantSyncResult(
                    status="updated",
                    point_id=str(existing_point_id),
                    message="Updated existing Qdrant payload.",
                    source=normalized_payload["source"],
                ).__dict__

            point_id = self._candidate_point_id(payload)
            vector_name, vector = self._empty_vector(client)
            point = {
                "id": point_id,
                "payload": normalized_payload,
                "vector": {vector_name: vector} if vector_name else vector,
            }
            client.upsert(
                collection_name=self.settings.qdrant_collection,
                points=[point],
            )
            return QdrantSyncResult(
                status="created",
                point_id=str(point_id),
                message="Created new Qdrant point with candidate payload.",
                source=normalized_payload["source"],
            ).__dict__
        except ImportError:
            return QdrantSyncResult(
                status="skipped",
                message="qdrant-client is not installed.",
                source=normalized_payload["source"],
            ).__dict__
        except Exception as exc:
            return QdrantSyncResult(
                status="error",
                message=str(exc),
                source=normalized_payload["source"],
            ).__dict__
