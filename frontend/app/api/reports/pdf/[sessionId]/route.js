import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE_NAME, hasAdminAccess, hasDeliveryAccess } from "@/lib/access"
import { logDeliveryAccessEvent } from "@/lib/access-log-store"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { getReportArtifact, persistSignalCheckPdfArtifact, readArtifactBuffer } from "@/lib/report-artifact-store"
import { buildSignalCheckPdf } from "@/lib/report-pdf"
import { buildReviewedReport } from "@/lib/report-format"

export async function GET(request, context) {
  const params = await context.params
  const sessionId = params?.sessionId
  const token = request.nextUrl.searchParams.get("access") || ""
  const authorization = request.headers.get("authorization")
  const cookieStore = await cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || ""
  const isAdmin = hasAdminAccess({ authorization, adminSessionToken })

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  if (!hasDeliveryAccess({ sessionId, token, authorization, adminSessionToken })) {
    return NextResponse.json({ error: "Access denied" }, { status: 401 })
  }

  await logDeliveryAccessEvent({
    session_id: sessionId,
    event_type: "pdf_download",
    access_mode: isAdmin ? "admin" : "signed_link",
    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
    user_agent: request.headers.get("user-agent") || ""
  })

  const existingArtifact = await getReportArtifact(sessionId, "signal_check_pdf")
  if (existingArtifact) {
    const pdfBuffer = await readArtifactBuffer(existingArtifact)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": existingArtifact.mime_type || "application/pdf",
        "Content-Disposition": `attachment; filename="${existingArtifact.filename}"`,
        "Content-Length": String(existingArtifact.size_bytes || pdfBuffer.length)
      }
    })
  }

  const [order, intake, auditRun] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestAuditRunForSession(sessionId)
  ])

  if (!order || !intake || !auditRun) {
    return NextResponse.json({ error: "Report data not found" }, { status: 404 })
  }

  const report = buildReviewedReport({ order, intake, auditRun })
  const pdf = await buildSignalCheckPdf({ report, sessionId })
  const artifact = await persistSignalCheckPdfArtifact(sessionId, pdf)

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${artifact.filename}"`
    }
  })
}
