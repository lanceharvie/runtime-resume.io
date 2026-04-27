import Link from "next/link"
import { cookies, headers } from "next/headers"
import { ADMIN_SESSION_COOKIE_NAME, hasAdminAccess, hasDeliveryAccess } from "@/lib/access"
import { logDeliveryAccessEvent } from "@/lib/access-log-store"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import DeliveryRepresentationPrompt from "@/components/delivery-representation-prompt"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

export default async function DeliveryPage({ params, searchParams }) {
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

  if (!order) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Delivery</div>
            <h1 className="rr-title">Delivery not found.</h1>
            <p className="rr-copy">The order reference could not be loaded.</p>
          </div>
        </section>
      </main>
    )
  }

  if (!order.delivered_at || !intake || !auditRun) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Delivery</div>
            <h1 className="rr-title">Your report is not ready yet.</h1>
            <p className="rr-copy">
              This delivery page becomes active after the review has been completed and marked as delivered.
            </p>
            <div className="rr-cta-row">
              <Link className="rr-btn-ghost" href={`/order/success?session_id=${encodeURIComponent(sessionId)}`}>
                Back to order
              </Link>
            </div>
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
            <div className="rr-eyebrow">Delivery</div>
            <h1 className="rr-title">Access required.</h1>
            <p className="rr-copy">This delivery link is protected. Use the emailed delivery link or contact support if it has expired.</p>
          </div>
        </section>
      </main>
    )
  }

  await logDeliveryAccessEvent({
    session_id: sessionId,
    event_type: "delivery_page_view",
    access_mode: isAdmin ? "admin" : "signed_link",
    ip_address: requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "",
    user_agent: requestHeaders.get("user-agent") || ""
  })

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Delivery</div>
          <h1 className="rr-title">Your reviewed Signal Check report is ready.</h1>
          <p className="rr-copy">
            This page contains the delivered report links for your order.
          </p>

          <div className="rr-card rr-order-panel" style={{ maxWidth: "42rem", marginTop: "1.5rem" }}>
            <div className="rr-field-label">Delivery details</div>
            <div className="rr-order-summary-row">
              <span>Email</span>
              <span>{order.customer_email || "—"}</span>
            </div>
            <div className="rr-order-summary-row">
              <span>Tier</span>
              <span>{order.tier_name || order.tier || "—"}</span>
            </div>
            <div className="rr-order-summary-row">
              <span>Delivered</span>
              <span>{formatDate(order.delivered_at)}</span>
            </div>
            <div className="rr-order-summary-row">
              <span>Delivery channel</span>
              <span>{order.delivery_channel || "—"}</span>
            </div>
            <div className="rr-order-summary-row">
              <span>Notes</span>
              <span>{order.delivery_notes || "—"}</span>
            </div>
          </div>

          <div className="rr-cta-row">
            <Link className="rr-btn-primary" href={`/report/${encodeURIComponent(sessionId)}?access=${encodeURIComponent(accessToken)}`}>
              View report online
            </Link>
            <Link className="rr-btn-ghost" href={`/api/reports/pdf/${encodeURIComponent(sessionId)}?access=${encodeURIComponent(accessToken)}`}>
              Download PDF
            </Link>
          </div>

          <DeliveryRepresentationPrompt sessionId={sessionId} accessToken={accessToken} />
        </div>
      </section>
    </main>
  )
}
