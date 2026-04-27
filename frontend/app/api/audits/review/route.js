import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { updateAuditReview } from "@/lib/audit-store"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const id = Number(body?.id)
  const reviewerNotes = typeof body?.reviewer_notes === "string" ? body.reviewer_notes : ""
  const reviewerOverride =
    body?.reviewer_override && typeof body.reviewer_override === "object"
      ? body.reviewer_override
      : {}

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Valid audit id is required" }, { status: 400 })
  }

  const updated = await updateAuditReview({
    id,
    reviewer_notes: reviewerNotes,
    reviewer_override: reviewerOverride
  })

  if (!updated) {
    return NextResponse.json({ error: "Audit run not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, run: updated })
}
