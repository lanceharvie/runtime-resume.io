import Link from "next/link"
import { cookies, headers } from "next/headers"
import { ADMIN_SESSION_COOKIE_NAME, hasAdminAccess, hasDeliveryAccess } from "@/lib/access"
import { logDeliveryAccessEvent } from "@/lib/access-log-store"
import ReportActions from "@/components/report-actions"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { buildReviewedReport } from "@/lib/report-format"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"

function scoreLabel(key) {
  return key.replace(/_/g, " ")
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

export default async function ReportPage({ params, searchParams }) {
  const { sessionId } = await params
  const routeSearchParams = await searchParams
  const accessToken = typeof routeSearchParams?.access === "string" ? routeSearchParams.access : ""
  const requestHeaders = await headers()
  const cookieStore = await cookies()
  const authorization = requestHeaders.get("authorization")
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || ""
  const isAdmin = hasAdminAccess({ authorization, adminSessionToken })

  const [order, intake, auditRun] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestAuditRunForSession(sessionId)
  ])

  if (!order || !intake || !auditRun) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Signal check report</div>
            <h1 className="rr-title">Report not available.</h1>
            <p className="rr-copy">A paid order, intake, and completed audit are required before a report can be rendered.</p>
          </div>
        </section>
      </main>
    )
  }

  if (!hasDeliveryAccess({ sessionId, token: accessToken, authorization, adminSessionToken })) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Signal check report</div>
            <h1 className="rr-title">Access required.</h1>
            <p className="rr-copy">This report link is protected. Use the emailed delivery link or contact support if you need it resent.</p>
          </div>
        </section>
      </main>
    )
  }

  await logDeliveryAccessEvent({
    session_id: sessionId,
    event_type: "report_view",
    access_mode: isAdmin ? "admin" : "signed_link",
    ip_address: requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "",
    user_agent: requestHeaders.get("user-agent") || ""
  })

  const report = buildReviewedReport({ order, intake, auditRun })
  const pdfHref = `/api/reports/pdf/${encodeURIComponent(sessionId)}${accessToken ? `?access=${encodeURIComponent(accessToken)}` : ""}`
  const showAdminLink = isAdmin

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Signal check report</div>
          <h1 className="rr-title">{report.verdict}</h1>
          <p className="rr-copy">
            This reviewed report summarizes how the resume is likely reading from the recruiter side and what should be fixed first.
          </p>

          <div className="print-hidden">
            <ReportActions pdfHref={pdfHref} />
            {showAdminLink ? (
              <div className="rr-cta-row">
                <Link className="rr-btn-ghost" href={`/admin/reviewer-queue/${encodeURIComponent(sessionId)}`}>
                  Back to reviewer page
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rr-order-grid" style={{ marginTop: "2rem", alignItems: "start" }}>
            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Candidate context</div>
              <div className="rr-order-summary-row"><span>Email</span><span>{report.candidate.email || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Target roles</span><span>{report.candidate.target_roles || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Market</span><span>{report.candidate.geographic_preference || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Experience</span><span>{report.candidate.years_experience || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Niche</span><span>{report.profile.niche || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Seniority</span><span>{report.profile.seniority || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Reviewed</span><span>{formatDate(report.generated_at)}</span></div>
              <div className="rr-order-summary-row"><span>Delivered</span><span>{order.delivered_at ? formatDate(order.delivered_at) : "Not yet marked"}</span></div>
              <div className="rr-order-summary-row"><span>Delivery channel</span><span>{order.delivery_channel || "—"}</span></div>
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Overall assessment</div>
              <div className="rr-order-summary-row">
                <span>Weighted total</span>
                <strong>{report.weighted_total}</strong>
              </div>
              <p className="rr-copy" style={{ marginTop: "1rem" }}>{report.candidate_summary}</p>

              <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
                <div className="rr-field-label">Dimension scores</div>
                {Object.entries(report.scores).map(([key, value]) => (
                  <div key={key} className="rr-order-summary-row">
                    <span>{scoreLabel(key)}</span>
                    <span>{value}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Top issues</div>
            <div style={{ display: "grid", gap: "1rem" }}>
              {report.top_issues.map((issue, index) => (
                <div key={`${issue.dimension}-${index}`}>
                  <strong>{scoreLabel(issue.dimension)}</strong>
                  <p className="rr-note">{issue.issue}</p>
                  <p className="rr-note" style={{ color: "#f0c36a" }}>{issue.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Priority recommendations</div>
            <div style={{ display: "grid", gap: "1rem" }}>
              {report.recommendations.map((item) => (
                <div key={item.priority}>
                  <strong>{item.action}</strong>
                  <p className="rr-note">{item.rationale}</p>
                  <p className="rr-note" style={{ color: "#7ee081" }}>{item.example}</p>
                </div>
              ))}
            </div>
          </div>

          {report.reviewer_notes ? (
            <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
              <div className="rr-field-label">Reviewer notes</div>
              <p className="rr-note">{report.reviewer_notes}</p>
            </div>
          ) : null}

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Recruiter notes</div>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {report.recruiter_notes.map((note, index) => (
                <p key={index} className="rr-note">{note}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
