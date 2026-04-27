import { getDb } from "@/lib/db"

function mapRewriteRow(row) {
  if (!row) return null
  return {
    ...row,
    rewrite: JSON.parse(row.rewrite_json || "{}")
  }
}

export async function createRewriteDraft({
  session_id,
  status = "draft",
  source_audit_id = null,
  source_filename = "",
  source_path = "",
  rewrite,
  generator_source = "",
  llm_provider = "",
  llm_model = "",
  prompt_version = "",
  preset_id = ""
}) {
  const database = getDb()
  const now = new Date().toISOString()
  const result = database
    .prepare(`
      INSERT INTO rewrite_drafts (
        session_id,
        status,
        source_audit_id,
        source_filename,
        source_path,
        rewrite_json,
        generator_source,
        llm_provider,
        llm_model,
        prompt_version,
        preset_id,
        created_at,
        updated_at
      ) VALUES (
        @session_id,
        @status,
        @source_audit_id,
        @source_filename,
        @source_path,
        @rewrite_json,
        @generator_source,
        @llm_provider,
        @llm_model,
        @prompt_version,
        @preset_id,
        @created_at,
        @updated_at
      )
    `)
    .run({
      session_id,
      status,
      source_audit_id,
      source_filename,
      source_path,
      rewrite_json: JSON.stringify(rewrite || {}),
      generator_source,
      llm_provider,
      llm_model,
      prompt_version,
      preset_id,
      created_at: now,
      updated_at: now
    })

  return getRewriteDraftById(result.lastInsertRowid)
}

export async function getRewriteDraftById(id) {
  const database = getDb()
  return mapRewriteRow(database.prepare("SELECT * FROM rewrite_drafts WHERE id = ?").get(id))
}

export async function getLatestRewriteDraftForSession(sessionId) {
  const database = getDb()
  const row = database
    .prepare(`
      SELECT *
      FROM rewrite_drafts
      WHERE session_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT 1
    `)
    .get(sessionId)

  return mapRewriteRow(row)
}

export async function listRewriteDraftsForSession(sessionId, limit = 20) {
  const database = getDb()
  const rows = database
    .prepare(`
      SELECT *
      FROM rewrite_drafts
      WHERE session_id = ?
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT ?
    `)
    .all(sessionId, limit)

  return rows.map(mapRewriteRow)
}

export async function saveRewriteDraftRevision({ id, status, rewrite }) {
  const existing = await getRewriteDraftById(id)
  if (!existing) return null

  return createRewriteDraft({
    session_id: existing.session_id,
    status: status || existing.status || "draft",
    source_audit_id: existing.source_audit_id,
    source_filename: existing.source_filename || "",
    source_path: existing.source_path || "",
    rewrite: rewrite || existing.rewrite || {},
    generator_source: existing.generator_source || "",
    llm_provider: existing.llm_provider || "",
    llm_model: existing.llm_model || "",
    prompt_version: existing.prompt_version || "",
    preset_id: existing.preset_id || ""
  })
}

export async function restoreRewriteDraftRevision(id) {
  const existing = await getRewriteDraftById(id)
  if (!existing) return null

  return createRewriteDraft({
    session_id: existing.session_id,
    status: existing.status || "draft",
    source_audit_id: existing.source_audit_id,
    source_filename: existing.source_filename || "",
    source_path: existing.source_path || "",
    rewrite: existing.rewrite || {},
    generator_source: existing.generator_source || "",
    llm_provider: existing.llm_provider || "",
    llm_model: existing.llm_model || "",
    prompt_version: existing.prompt_version || "",
    preset_id: existing.preset_id || ""
  })
}
