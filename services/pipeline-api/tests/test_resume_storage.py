from base64 import b64encode
from pathlib import Path
from zipfile import ZipFile

from app.config import Settings
from app.services.resume_storage import ResumeStorageService


def test_store_resume_extracts_docx_text(tmp_path, monkeypatch):
    monkeypatch.setattr(
        "app.services.resume_storage.get_settings",
        lambda: Settings(resume_storage_root=str(tmp_path)),
    )

    docx_path = tmp_path / "sample.docx"
    with ZipFile(docx_path, "w") as archive:
        archive.writestr(
            "word/document.xml",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                "<w:body><w:p><w:r><w:t>Hello resume</w:t></w:r></w:p></w:body></w:document>"
            ),
        )

    result = ResumeStorageService().store_resume(
        session_id="test-session",
        filename="resume.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        base64_data=b64encode(docx_path.read_bytes()).decode("ascii"),
    )

    assert result is not None
    assert result.extraction_status == "extracted"
    assert result.extracted_text == "Hello resume"
    assert Path(result.storage_path).exists()


def test_locate_resume_rejects_paths_outside_storage_root(tmp_path, monkeypatch):
    storage_root = tmp_path / "storage"
    storage_root.mkdir()
    outside_path = tmp_path / "outside.pdf"
    outside_path.write_text("test", encoding="utf-8")
    monkeypatch.setattr(
        "app.services.resume_storage.get_settings",
        lambda: Settings(resume_storage_root=str(storage_root)),
    )

    assert ResumeStorageService().locate_resume(str(outside_path)) is None
