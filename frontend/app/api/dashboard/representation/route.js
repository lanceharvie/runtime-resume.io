import { NextResponse } from "next/server"
import {
  getPipelineDashboardRepresentation,
  isPipelineApiConfigured,
  submitPipelineDashboardRepresentation,
} from "@/lib/pipeline-api"

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

    const data = await getPipelineDashboardRepresentation(sessionToken)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dashboard representation" },
      { status: 400 }
    )
  }
}

export async function POST(request) {
  try {
    if (!isPipelineApiConfigured()) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }

    const sessionToken = request.cookies.get(CANDIDATE_SESSION_COOKIE)?.value || ""
    if (!sessionToken) {
      return NextResponse.json({ error: "No dashboard session" }, { status: 401 })
    }

    const payload = await request.json()
    const data = await submitPipelineDashboardRepresentation(sessionToken, payload)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update dashboard representation" },
      { status: 400 }
    )
  }
}
