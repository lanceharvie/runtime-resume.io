import { NextResponse } from "next/server"
import { isPipelineApiConfigured, logoutPipelineDashboardSession } from "@/lib/pipeline-api"

const CANDIDATE_SESSION_COOKIE = "runtime_resume_candidate_session"

export async function POST(request) {
  const sessionToken = request.cookies.get(CANDIDATE_SESSION_COOKIE)?.value || ""

  try {
    if (isPipelineApiConfigured() && sessionToken) {
      await logoutPipelineDashboardSession(sessionToken)
    }
  } catch {
    // Clearing the local cookie is still worthwhile even if the upstream revoke call fails.
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(CANDIDATE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    expires: new Date(0)
  })
  return response
}
