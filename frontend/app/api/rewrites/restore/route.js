import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { restoreRewriteDraftRevision } from "@/lib/rewrite-store"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const id = Number(body?.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Valid rewrite draft id is required" }, { status: 400 })
  }

  const restored = await restoreRewriteDraftRevision(id)
  if (!restored) {
    return NextResponse.json({ error: "Rewrite draft not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, draft: restored })
}
