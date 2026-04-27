import { NextResponse } from "next/server"
import { applyAdminSessionCookie, hasValidAdminSessionRequest } from "@/lib/access"

export async function POST(request) {
  if (!hasValidAdminSessionRequest(request)) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  return applyAdminSessionCookie(response)
}
