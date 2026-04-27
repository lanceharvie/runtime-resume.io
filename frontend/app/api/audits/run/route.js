import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { createAuditRun } from "@/lib/audit-store"
import { generateTier1Audit } from "@/lib/audit-engine"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { parseResumeFile } from "@/lib/resume-parser"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const sessionId = String(body?.session_id || "").trim()

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const [order, intake] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId)
  ])

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (!intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 })
  }

  if (!intake.resume_path) {
    return NextResponse.json({ error: "No uploaded resume is available for audit" }, { status: 400 })
  }

  try {
    const parsed = await parseResumeFile(intake.resume_path)
    const audit = generateTier1Audit({
      order,
      intake,
      extractedText: parsed.text,
      parser: parsed.parser
    })

    const run = await createAuditRun({
      session_id: sessionId,
      status: "completed",
      source_filename: intake.resume_filename || "",
      source_path: intake.resume_path || "",
      extracted_text: parsed.text,
      audit
    })

    return NextResponse.json({ ok: true, run })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run audit" },
      { status: 500 }
    )
  }
}
