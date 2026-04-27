import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { getDb } from "@/lib/db"

const REPORTS_DIR = path.join(process.cwd(), "data", "reports")

function ensureReportsDir() {
  mkdirSync(REPORTS_DIR, { recursive: true })
}

export async function upsertReportArtifact({
  session_id,
  artifact_type,
  filename,
  file_path,
  mime_type = "application/pdf",
  size_bytes = null
}) {
  const database = getDb()
  const now = new Date().toISOString()

  database
    .prepare(`
      INSERT INTO report_artifacts (
        session_id,
        artifact_type,
        filename,
        file_path,
        mime_type,
        size_bytes,
        created_at,
        updated_at
      ) VALUES (
        @session_id,
        @artifact_type,
        @filename,
        @file_path,
        @mime_type,
        @size_bytes,
        @created_at,
        @updated_at
      )
      ON CONFLICT(session_id, artifact_type) DO UPDATE SET
        filename = excluded.filename,
        file_path = excluded.file_path,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        updated_at = excluded.updated_at
    `)
    .run({
      session_id,
      artifact_type,
      filename,
      file_path,
      mime_type,
      size_bytes,
      created_at: now,
      updated_at: now
    })

  return getReportArtifact(session_id, artifact_type)
}

export async function getReportArtifact(sessionId, artifactType = "signal_check_pdf") {
  const database = getDb()

  return database
    .prepare(`
      SELECT *
      FROM report_artifacts
      WHERE session_id = ? AND artifact_type = ?
      LIMIT 1
    `)
    .get(sessionId, artifactType)
}

export async function persistSignalCheckPdfArtifact(sessionId, pdfBuffer) {
  ensureReportsDir()

  const filename = `runtime-resume-signal-check-${sessionId}.pdf`
  const filePath = path.join(REPORTS_DIR, filename)
  writeFileSync(filePath, pdfBuffer)

  return upsertReportArtifact({
    session_id: sessionId,
    artifact_type: "signal_check_pdf",
    filename,
    file_path: filePath,
    mime_type: "application/pdf",
    size_bytes: statSync(filePath).size
  })
}

export async function readArtifactBuffer(artifact) {
  return readFileSync(artifact.file_path)
}
