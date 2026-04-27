from __future__ import annotations

import base64
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile

from app.config import get_settings


@dataclass
class ResumeStorageResult:
    filename: str
    storage_path: str
    extracted_text: str | None
    extraction_status: str


class ResumeStorageService:
    def _storage_root(self) -> Path:
        return Path(get_settings().resume_storage_root).expanduser().resolve()

    def store_resume(
        self,
        *,
        session_id: str,
        filename: str | None,
        mime_type: str | None,
        base64_data: str | None,
    ) -> ResumeStorageResult | None:
        if not filename or not base64_data:
            return None

        safe_name = self._safe_filename(filename)
        target_dir = self._storage_root() / self._safe_slug(session_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / safe_name
        resume_bytes = base64.b64decode(base64_data)
        target_path.write_bytes(resume_bytes)

        extracted_text, extraction_status = self._extract_text(
            target_path,
            mime_type=mime_type,
        )
        return ResumeStorageResult(
            filename=safe_name,
            storage_path=str(target_path),
            extracted_text=extracted_text,
            extraction_status=extraction_status,
        )

    def locate_resume(self, storage_path: str | None) -> Path | None:
        if not storage_path:
            return None

        try:
            resume_path = Path(storage_path).expanduser().resolve()
        except OSError:
            return None

        storage_root = self._storage_root()
        try:
            resume_path.relative_to(storage_root)
        except ValueError:
            return None

        if not resume_path.is_file():
            return None
        return resume_path

    def _extract_text(self, path: Path, *, mime_type: str | None) -> tuple[str | None, str]:
        suffix = path.suffix.lower()
        if suffix == ".pdf" or mime_type == "application/pdf":
            return self._extract_pdf_text(path)
        if suffix == ".docx" or mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self._extract_docx_text(path)
        if suffix == ".doc":
            return None, "stored_only_doc_unsupported"
        return None, "stored_only_unsupported"

    def _extract_pdf_text(self, path: Path) -> tuple[str | None, str]:
        try:
            result = subprocess.run(
                ["pdftotext", "-layout", str(path), "-"],
                check=True,
                capture_output=True,
                text=True,
            )
        except (FileNotFoundError, subprocess.CalledProcessError):
            return None, "stored_only_pdf_extract_failed"

        text = result.stdout.strip()
        return (text or None), "extracted" if text else "stored_only_pdf_empty"

    def _extract_docx_text(self, path: Path) -> tuple[str | None, str]:
        try:
            with ZipFile(path) as archive:
                xml_bytes = archive.read("word/document.xml")
        except (KeyError, FileNotFoundError, OSError):
            return None, "stored_only_docx_extract_failed"

        try:
            root = ElementTree.fromstring(xml_bytes)
        except ElementTree.ParseError:
            return None, "stored_only_docx_extract_failed"

        namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        paragraphs: list[str] = []
        for paragraph in root.findall(".//w:p", namespace):
            runs = [
                node.text.strip()
                for node in paragraph.findall(".//w:t", namespace)
                if node.text and node.text.strip()
            ]
            if runs:
                paragraphs.append("".join(runs))

        text = "\n".join(paragraphs).strip()
        return (text or None), "extracted" if text else "stored_only_docx_empty"

    def _safe_filename(self, filename: str) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", filename.strip())
        return cleaned[:200] or "resume_upload"

    def _safe_slug(self, value: str) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
        return cleaned[:120] or "session"
