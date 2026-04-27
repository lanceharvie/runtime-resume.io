import { NextResponse } from "next/server"
import { getPipelineDashboardNotifications, isPipelineApiConfigured } from "@/lib/pipeline-api"

const CANDIDATE_SESSION_COOKIE = "runtime_resume_candidate_session"

export async function GET(request) {
  try {
    if (!isPipelineApiConfigured()) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }

    const sessionToken = request.cookies.get(CANDIDATE_SESSION_COOKIE)?.value || ""
    if (!sessionToken) {
      return NextResponse.json({ error: "No dashboard session" }, { status: 401 })
    }

    const data = await getPipelineDashboardNotifications(sessionToken)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dashboard notifications" },
      { status: 400 }
    )
  }
}
