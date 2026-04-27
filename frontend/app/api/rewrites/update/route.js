import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { saveRewriteDraftRevision } from "@/lib/rewrite-store"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const id = Number(body?.id)
  const status = typeof body?.status === "string" ? body.status : "draft"
  const rewrite = body?.rewrite && typeof body.rewrite === "object" ? body.rewrite : null

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Valid rewrite draft id is required" }, { status: 400 })
  }

  if (!rewrite) {
    return NextResponse.json({ error: "rewrite payload is required" }, { status: 400 })
  }

  const updated = await saveRewriteDraftRevision({ id, status, rewrite })
  if (!updated) {
    return NextResponse.json({ error: "Rewrite draft not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, draft: updated })
}
