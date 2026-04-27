import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { getDb } from "@/lib/db"

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads")

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function saveResumeUpload(sessionId, file) {
  if (!file || typeof file.name !== "string" || !file.name) {
    return { filename: "", path: "" }
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const ext = path.extname(file.name) || ".bin"
  const safeBase = sanitizeFilename(path.basename(file.name, ext))
  const filename = `${sessionId}-${safeBase}${ext}`
  const targetPath = path.join(UPLOAD_DIR, filename)
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(targetPath, bytes)

  return { filename, path: targetPath }
}

export async function upsertIntakeSubmission(submission) {
  const database = getDb()
  const now = new Date().toISOString()
  const existing = database
    .prepare("SELECT * FROM intake_submissions WHERE session_id = ?")
    .get(submission.session_id)

  const merged = {
    ...existing,
    ...submission,
    created_at: existing?.created_at || now,
    updated_at: now
  }

  database
    .prepare(`
      INSERT INTO intake_submissions (
        session_id,
        linkedin_url,
        target_roles,
        target_companies,
        key_achievements,
        years_experience,
        geographic_preference,
        target_locations,
        salary_range,
        role_types,
        job_seek_status,
        open_to_representation,
        relocation_flag,
        concerns,
        resume_filename,
        resume_path,
        created_at,
        updated_at
      ) VALUES (
        @session_id,
        @linkedin_url,
        @target_roles,
        @target_companies,
        @key_achievements,
        @years_experience,
        @geographic_preference,
        @target_locations,
        @salary_range,
        @role_types,
        @job_seek_status,
        @open_to_representation,
        @relocation_flag,
        @concerns,
        @resume_filename,
        @resume_path,
        @created_at,
        @updated_at
      )
      ON CONFLICT(session_id) DO UPDATE SET
        linkedin_url = excluded.linkedin_url,
        target_roles = excluded.target_roles,
        target_companies = excluded.target_companies,
        key_achievements = excluded.key_achievements,
        years_experience = excluded.years_experience,
        geographic_preference = excluded.geographic_preference,
        target_locations = excluded.target_locations,
        salary_range = excluded.salary_range,
        role_types = excluded.role_types,
        job_seek_status = excluded.job_seek_status,
        open_to_representation = excluded.open_to_representation,
        relocation_flag = excluded.relocation_flag,
        concerns = excluded.concerns,
        resume_filename = excluded.resume_filename,
        resume_path = excluded.resume_path,
        updated_at = excluded.updated_at
    `)
    .run({
      session_id: merged.session_id,
      linkedin_url: merged.linkedin_url || "",
      target_roles: merged.target_roles || "",
      target_companies: merged.target_companies || "",
      key_achievements: merged.key_achievements || "",
      years_experience: merged.years_experience || "",
      geographic_preference: merged.geographic_preference || "",
      target_locations: merged.target_locations || "",
      salary_range: merged.salary_range || "",
      role_types: merged.role_types || "",
      job_seek_status: merged.job_seek_status || "",
      open_to_representation: merged.open_to_representation || "",
      relocation_flag: merged.relocation_flag || "",
      concerns: merged.concerns || "",
      resume_filename: merged.resume_filename || "",
      resume_path: merged.resume_path || "",
      created_at: merged.created_at,
      updated_at: merged.updated_at
    })

  return getIntakeSubmission(merged.session_id)
}

export async function getIntakeSubmission(sessionId) {
  const database = getDb()
  return database
    .prepare("SELECT * FROM intake_submissions WHERE session_id = ?")
    .get(sessionId) || null
}

export async function listRecentIntakeSubmissions(limit = 50) {
  const database = getDb()
  return database
    .prepare(`
      SELECT intake_submissions.*, orders.customer_email, orders.tier_name
      FROM intake_submissions
      LEFT JOIN orders ON orders.session_id = intake_submissions.session_id
      ORDER BY datetime(intake_submissions.updated_at) DESC
      LIMIT ?
    `)
    .all(limit)
}

export async function listReviewerQueue(limit = 50) {
  const database = getDb()
  return database
    .prepare(`
      SELECT
        intake_submissions.*,
        orders.customer_email,
        orders.tier,
        orders.tier_name,
        orders.paid_at,
        orders.intake_submitted_at,
        orders.delivered_at,
        orders.delivery_email_sent_at
      FROM intake_submissions
      INNER JOIN orders ON orders.session_id = intake_submissions.session_id
      ORDER BY datetime(intake_submissions.updated_at) DESC
      LIMIT ?
    `)
    .all(limit)
}
