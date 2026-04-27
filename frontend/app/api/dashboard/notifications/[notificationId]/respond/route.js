import { NextResponse } from "next/server"
import { isPipelineApiConfigured, respondToPipelineDashboardNotification } from "@/lib/pipeline-api"

const CANDIDATE_SESSION_COOKIE = "runtime_resume_candidate_session"

export async function POST(request, { params }) {
  try {
    if (!isPipelineApiConfigured()) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }

    const sessionToken = request.cookies.get(CANDIDATE_SESSION_COOKIE)?.value || ""
    if (!sessionToken) {
      return NextResponse.json({ error: "No dashboard session" }, { status: 401 })
    }

    const payload = await request.json()
    const routeParams = await params
    const notificationId = routeParams?.notificationId || ""
    const data = await respondToPipelineDashboardNotification(sessionToken, notificationId, payload)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to respond to dashboard notification" },
      { status: 400 }
    )
  }
}
