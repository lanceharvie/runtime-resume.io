import { NextResponse } from "next/server"
import { applyAdminSessionCookie, getAdminPassword, getAdminUsername } from "@/lib/access"

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const username = String(body?.username || "")
  const password = String(body?.password || "")

  if (!getAdminUsername() || !getAdminPassword()) {
    return NextResponse.json({ error: "Admin login is not configured" }, { status: 500 })
  }

  if (username !== getAdminUsername() || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  return applyAdminSessionCookie(response)
}
