import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { buildRewriteDraftPdf } from "@/lib/report-pdf"
import { getLatestRewriteDraftForSession } from "@/lib/rewrite-store"

export async function GET(request, context) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const params = await context.params
  const sessionId = params?.sessionId

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const [order, intake, rewriteDraft] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestRewriteDraftForSession(sessionId)
  ])

  if (!order || !rewriteDraft) {
    return NextResponse.json({ error: "Rewrite draft not found" }, { status: 404 })
  }

  const pdf = await buildRewriteDraftPdf({ rewriteDraft, order, intake, sessionId })
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="runtime-resume-rewrite-${sessionId}.pdf"`
    }
  })
}
