import { getDb } from "@/lib/db"

function mapAuditRow(row) {
  if (!row) return null

  return {
    ...row,
    audit: JSON.parse(row.audit_json || "{}"),
    reviewer_override: JSON.parse(row.reviewer_override_json || "{}")
  }
}

export async function createAuditRun({
  session_id,
  status = "completed",
  source_filename = "",
  source_path = "",
  extracted_text = "",
  audit
}) {
  const database = getDb()
  const now = new Date().toISOString()

  const result = database
    .prepare(`
      INSERT INTO audit_runs (
        session_id,
        status,
        source_filename,
      source_path,
      extracted_text,
      audit_json,
      reviewer_notes,
      reviewer_override_json,
      created_at,
      updated_at
    ) VALUES (
        @session_id,
        @status,
        @source_filename,
      @source_path,
      @extracted_text,
      @audit_json,
      @reviewer_notes,
      @reviewer_override_json,
      @created_at,
      @updated_at
    )
    `)
    .run({
      session_id,
      status,
      source_filename,
      source_path,
      extracted_text,
      audit_json: JSON.stringify(audit),
      reviewer_notes: "",
      reviewer_override_json: "{}",
      created_at: now,
      updated_at: now
    })

  return getLatestAuditRunForSession(session_id) || getAuditRunById(result.lastInsertRowid)
}

export async function getAuditRunById(id) {
  const database = getDb()
  const row = database.prepare("SELECT * FROM audit_runs WHERE id = ?").get(id)
  return mapAuditRow(row)
}

export async function getLatestAuditRunForSession(sessionId) {
  const database = getDb()
  const row = database
    .prepare(`
      SELECT *
      FROM audit_runs
      WHERE session_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT 1
    `)
    .get(sessionId)

  return mapAuditRow(row)
}

export async function updateAuditReview({
  id,
  reviewer_notes = "",
  reviewer_override = {}
}) {
  const database = getDb()
  const existing = await getAuditRunById(id)
  if (!existing) return null

  database
    .prepare(`
      UPDATE audit_runs
      SET reviewer_notes = ?,
          reviewer_override_json = ?,
          updated_at = ?
      WHERE id = ?
    `)
    .run(
      reviewer_notes,
      JSON.stringify(reviewer_override || {}),
      new Date().toISOString(),
      id
    )

  return getAuditRunById(id)
}
