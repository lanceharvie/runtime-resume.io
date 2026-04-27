import { NextResponse } from "next/server"
import { getPipelineDashboardResume, isPipelineApiConfigured } from "@/lib/pipeline-api"

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

    const upstream = await getPipelineDashboardResume(sessionToken)
    const arrayBuffer = await upstream.arrayBuffer()
    const headers = new Headers()
    const contentType = upstream.headers.get("content-type") || "application/octet-stream"
    const contentDisposition = upstream.headers.get("content-disposition") || 'attachment; filename="resume"'
    headers.set("content-type", contentType)
    headers.set("content-disposition", contentDisposition)
    return new Response(arrayBuffer, { status: 200, headers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to download dashboard resume" },
      { status: 400 }
    )
  }
}
