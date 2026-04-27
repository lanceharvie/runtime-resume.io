import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { sendReportDeliveryEmail } from "@/lib/email"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId, markDeliveryEmailSent, markOrderDelivered } from "@/lib/order-store"
import { isPipelineApiConfigured, notifyPipelineDeliveryComplete } from "@/lib/pipeline-api"
import { persistSignalCheckPdfArtifact } from "@/lib/report-artifact-store"
import { buildSignalCheckPdf } from "@/lib/report-pdf"
import { buildReviewedReport } from "@/lib/report-format"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  try {
    const payload = await request.json()
    const sessionId = payload?.session_id
    const deliveryChannel = payload?.delivery_channel || "email"
    const deliveryNotes = payload?.delivery_notes || "Sent delivery email"

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 })
    }

    const [order, intake, auditRun] = await Promise.all([
      getOrderBySessionId(sessionId),
      getIntakeSubmission(sessionId),
      getLatestAuditRunForSession(sessionId)
    ])

    if (!order || !intake || !auditRun) {
      return NextResponse.json({ error: "Order, intake, or audit not found" }, { status: 404 })
    }

    const report = buildReviewedReport({ order, intake, auditRun })
    const pdf = await buildSignalCheckPdf({ report, sessionId })
    const artifact = await persistSignalCheckPdfArtifact(sessionId, pdf)

    await sendReportDeliveryEmail(order, artifact)
    await markOrderDelivered(sessionId, {
      delivery_channel: deliveryChannel,
      delivery_notes: deliveryNotes
    })
    const updatedOrder = await markDeliveryEmailSent(sessionId)
    let pipeline = null

    if (isPipelineApiConfigured()) {
      try {
        pipeline = await notifyPipelineDeliveryComplete(sessionId, {
          delivery_channel: deliveryChannel,
          delivery_notes: deliveryNotes,
          customer_email: order.customer_email || null
        })
      } catch (pipelineError) {
        pipeline = {
          ok: false,
          error: pipelineError instanceof Error ? pipelineError.message : "Pipeline delivery-complete notification failed"
        }
      }
    }

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      artifact,
      pipeline
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send delivery" },
      { status: 500 }
    )
  }
}
