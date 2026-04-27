import { NextResponse } from "next/server"
import { getIntakeSubmission, saveResumeUpload, upsertIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId, markIntakeSubmitted } from "@/lib/order-store"
import { isPipelineApiConfigured, submitPipelineIntake } from "@/lib/pipeline-api"

function toBase64(buffer) {
  return Buffer.from(buffer).toString("base64")
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id") || ""

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const order = await getOrderBySessionId(sessionId)
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const intake = await getIntakeSubmission(sessionId)
  return NextResponse.json({ order, intake })
}

export async function POST(request) {
  const formData = await request.formData()
  const sessionId = String(formData.get("session_id") || "").trim()

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const order = await getOrderBySessionId(sessionId)
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const resumeFile = formData.get("resume_file")
  const upload = resumeFile instanceof File && resumeFile.size > 0
    ? await saveResumeUpload(sessionId, resumeFile)
    : { filename: "", path: "" }
  const resumeBase64 = resumeFile instanceof File && resumeFile.size > 0
    ? toBase64(await resumeFile.arrayBuffer())
    : null

  const intake = await upsertIntakeSubmission({
    session_id: sessionId,
    linkedin_url: String(formData.get("linkedin_url") || "").trim(),
    target_roles: String(formData.get("target_roles") || "").trim(),
    target_companies: String(formData.get("target_companies") || "").trim(),
    key_achievements: String(formData.get("key_achievements") || "").trim(),
    years_experience: String(formData.get("years_experience") || "").trim(),
    geographic_preference: String(formData.get("geographic_preference") || "").trim(),
    target_locations: String(formData.get("target_locations") || "").trim(),
    salary_range: String(formData.get("salary_range") || "").trim(),
    role_types: String(formData.get("role_types") || "").trim(),
    job_seek_status: String(formData.get("job_seek_status") || "").trim(),
    open_to_representation: formData.has("open_to_representation") ? "true" : "false",
    relocation_flag: formData.has("relocation_flag") ? "true" : "false",
    concerns: String(formData.get("concerns") || "").trim(),
    resume_filename: upload.filename,
    resume_path: upload.path
  })

  await markIntakeSubmitted(sessionId)

  let pipeline = null
  if (isPipelineApiConfigured()) {
    pipeline = await submitPipelineIntake({
      session_id: sessionId,
      email: order.customer_email,
      full_name: order.customer_name || null,
      linkedin_url: intake.linkedin_url || null,
      target_roles: intake.target_roles || null,
      target_companies: intake.target_companies || null,
      key_achievements: intake.key_achievements || null,
      years_experience: intake.years_experience || null,
      geographic_preference: intake.geographic_preference || null,
      target_locations: String(formData.get("target_locations") || "").trim() || null,
      salary_range: String(formData.get("salary_range") || "").trim() || null,
      role_types: String(formData.get("role_types") || "").trim() || null,
      concerns: intake.concerns || null,
      resume_filename: upload.filename || null,
      resume_mime_type: resumeFile instanceof File && resumeFile.type ? resumeFile.type : null,
      resume_base64: resumeBase64,
      job_seek_status: String(formData.get("job_seek_status") || "").trim() || "open_to_opportunities",
      open_to_representation: formData.has("open_to_representation"),
      relocation_flag: formData.has("relocation_flag")
    })
  }

  return NextResponse.json({ ok: true, intake, pipeline })
}
