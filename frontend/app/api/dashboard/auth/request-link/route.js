import { NextResponse } from "next/server"
import { isPipelineApiConfigured, requestPipelineMagicLink } from "@/lib/pipeline-api"

export async function POST(request) {
  try {
    if (!isPipelineApiConfigured()) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }

    const payload = await request.json()
    const data = await requestPipelineMagicLink({
      email: payload?.email || ""
    })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to request dashboard magic link" },
      { status: 400 }
    )
  }
}

