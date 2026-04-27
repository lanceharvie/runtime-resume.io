import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE_NAME, hasDeliveryAccess } from "@/lib/access"
import { getPipelineRepresentationPrompt, submitPipelineRepresentationDecision } from "@/lib/pipeline-api"

async function checkAccess(sessionId, accessToken) {
  const requestHeaders = await headers()
  const cookieStore = await cookies()
  const authorization = requestHeaders.get("authorization")
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || ""

  return hasDeliveryAccess({
    sessionId,
    token: accessToken,
    authorization,
    adminSessionToken,
  })
}

export async function GET(request, context) {
  const params = await context.params
  const sessionId = params?.sessionId
  const accessToken = request.nextUrl.searchParams.get("access") || ""

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }
  if (!(await checkAccess(sessionId, accessToken))) {
    return NextResponse.json({ error: "Delivery access required" }, { status: 401 })
  }

  try {
    const data = await getPipelineRepresentationPrompt(sessionId)
    if (!data) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load representation prompt" },
      { status: 502 },
    )
  }
}

export async function POST(request, context) {
  const params = await context.params
  const sessionId = params?.sessionId
  const body = await request.json().catch(() => ({}))
  const accessToken = typeof body?.access === "string" ? body.access : request.nextUrl.searchParams.get("access") || ""

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }
  if (!(await checkAccess(sessionId, accessToken))) {
    return NextResponse.json({ error: "Delivery access required" }, { status: 401 })
  }

  try {
    const data = await submitPipelineRepresentationDecision(sessionId, {
      decision: typeof body?.decision === "string" ? body.decision : "",
    })
    if (!data) {
      return NextResponse.json({ error: "Pipeline API is not configured" }, { status: 503 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record representation decision" },
      { status: 502 },
    )
  }
}
