import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { getRewriteSettings, saveRewriteSettings } from "@/lib/rewrite-settings-store"

export async function GET(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  return NextResponse.json({ ok: true, settings: getRewriteSettings() })
}

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))

  try {
    const settings = saveRewriteSettings(body || {})
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save rewrite settings" }, { status: 500 })
  }
}
