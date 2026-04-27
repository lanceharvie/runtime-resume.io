import { getDb } from "@/lib/db"

const REDACTED = "[redacted]"
const TRUNCATE_LIMIT = 2000
const REDACT_KEYS = new Set([
  "authorization",
  "api_key",
  "apikey",
  "customer_email",
  "email",
  "extracted_text",
  "linkedin_url",
  "resume_path",
  "source_path"
])

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function sanitizeForTrace(value, key = "") {
  const normalizedKey = String(key || "").toLowerCase()

  if (REDACT_KEYS.has(normalizedKey)) {
    return REDACTED
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForTrace(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeForTrace(entryValue, entryKey)])
    )
  }

  if (typeof value === "string") {
    return value.length > TRUNCATE_LIMIT ? `${value.slice(0, TRUNCATE_LIMIT)}...<truncated>` : value
  }

  return value
}

function serialize(value) {
  if (value == null) return ""
  const text = JSON.stringify(sanitizeForTrace(value))
  return text.length > 40000 ? `${text.slice(0, 40000)}...<truncated>` : text
}

function mapRow(row) {
  if (!row) return null
  return {
    ...row,
    request: safeJsonParse(row.request_json, null),
    response: safeJsonParse(row.response_json, null)
  }
}

export async function logRewriteTrace({ rewrite_draft_id = null, session_id, trace }) {
  if (!session_id || !trace) return null

  const database = getDb()
  const now = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO llm_rewrite_traces (
      rewrite_draft_id,
      session_id,
      trace_status,
      provider,
      model,
      prompt_version,
      preset_id,
      request_json,
      response_json,
      error_message,
      created_at
    ) VALUES (
      @rewrite_draft_id,
      @session_id,
      @trace_status,
      @provider,
      @model,
      @prompt_version,
      @preset_id,
      @request_json,
      @response_json,
      @error_message,
      @created_at
    )
  `).run({
    rewrite_draft_id,
    session_id,
    trace_status: trace.trace_status || "unknown",
    provider: trace.provider || "",
    model: trace.model || "",
    prompt_version: trace.prompt_version || "",
    preset_id: trace.preset_id || "",
    request_json: serialize(trace.request_body || trace.request || null),
    response_json: serialize(trace.response_body || trace.response || null),
    error_message: trace.error_message || "",
    created_at: now
  })

  return getRewriteTraceById(result.lastInsertRowid)
}

export async function getRewriteTraceById(id) {
  const database = getDb()
  return mapRow(database.prepare("SELECT * FROM llm_rewrite_traces WHERE id = ?").get(id))
}

export async function listRewriteTracesForSession(sessionId, limit = 10) {
  const database = getDb()
  const rows = database.prepare(`
    SELECT *
    FROM llm_rewrite_traces
    WHERE session_id = ?
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ?
  `).all(sessionId, limit)

  return rows.map(mapRow)
}
