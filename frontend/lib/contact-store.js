import { getDb } from "@/lib/db"

function nowIso() {
  return new Date().toISOString()
}

function mapInquiry(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    linkedin_url: row.linkedin_url || "",
    target_role: row.target_role || "",
    geography: row.geography || "",
    fit_question: row.fit_question || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export async function createContactInquiry(input) {
  const db = getDb()
  const now = nowIso()
  const record = {
    name: String(input?.name || "").trim(),
    email: String(input?.email || "").trim(),
    linkedin_url: String(input?.linkedin_url || "").trim(),
    target_role: String(input?.target_role || "").trim(),
    geography: String(input?.geography || "").trim(),
    fit_question: String(input?.fit_question || "").trim(),
    created_at: now,
    updated_at: now
  }

  const result = db.prepare(`
    INSERT INTO contact_inquiries (
      name,
      email,
      linkedin_url,
      target_role,
      geography,
      fit_question,
      created_at,
      updated_at
    ) VALUES (
      @name,
      @email,
      @linkedin_url,
      @target_role,
      @geography,
      @fit_question,
      @created_at,
      @updated_at
    )
  `).run(record)

  return mapInquiry(db.prepare("SELECT * FROM contact_inquiries WHERE id = ?").get(result.lastInsertRowid))
}

export async function listRecentContactInquiries(limit = 50) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT *
    FROM contact_inquiries
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ?
  `).all(limit)
  return rows.map(mapInquiry)
}
