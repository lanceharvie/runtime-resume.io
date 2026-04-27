import { NextResponse } from "next/server"
import { isPipelineApiConfigured, verifyPipelineMagicLink } from "@/lib/pipeline-api"

const CANDIDATE_SESSION_COOKIE = "runtime_resume_candidate_session"

export async function POST(request) {
  try {
    if (!isPipelineApiConfigured()) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }

    const payload = await request.json()
    const data = await verifyPipelineMagicLink({
      token: payload?.token || ""
    })

    const response = NextResponse.json({
      ok: true,
      email: data.email,
      session_expires_at: data.session_expires_at
    })

    response.cookies.set(CANDIDATE_SESSION_COOKIE, data.session_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires: new Date(data.session_expires_at)
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify dashboard magic link" },
      { status: 400 }
    )
  }
}

