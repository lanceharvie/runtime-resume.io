import Link from "next/link"
import { TURNAROUND_LABELS } from "@/lib/order-config"
import { getOrderBySessionId } from "@/lib/order-store"

export default async function SuccessPage({ searchParams }) {
  const params = await searchParams
  const sessionId = typeof params?.session_id === "string" ? params.session_id : ""

  const order = sessionId ? await getOrderBySessionId(sessionId) : null
  const error = !sessionId ? "Missing order reference." : !order ? "Unable to find that order reference yet." : ""
  const purchasedTier = order?.tier || ""
  const turnaround = TURNAROUND_LABELS[purchasedTier] || ""

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Success</div>
          <h1 className="rr-title">You&apos;re booked. Check your email for next steps.</h1>
          <p className="rr-copy">
            Your payment has been submitted. The next step is completing your intake so the review or rewrite can start.
          </p>
          {order ? (
            <div className="rr-card rr-order-panel" style={{ maxWidth: "42rem", marginTop: "1.5rem" }}>
              <div className="rr-field-label">Booking details</div>
              <div className="rr-order-summary-row">
                <span>Status</span>
                <span>{order.payment_status || order.checkout_status || "pending"}</span>
              </div>
              <div className="rr-order-summary-row">
                <span>Email</span>
                <span>{order.customer_email || "Captured during checkout"}</span>
              </div>
              {order.tier_name ? (
                <div className="rr-order-summary-row">
                  <span>Tier</span>
                  <span>{order.tier_name}</span>
                </div>
              ) : null}
              {turnaround ? (
                <div className="rr-order-summary-row">
                  <span>Expected turnaround</span>
                  <span>{turnaround}</span>
                </div>
              ) : null}
              <div className="rr-order-summary-row">
                <span>Confirmation email</span>
                <span>
                  {order.confirmation_email_sent_at
                    ? "Sent"
                    : order.payment_status === "paid"
                      ? "Queued after webhook confirmation"
                      : "Pending payment confirmation"}
                </span>
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="rr-note mt-4" style={{ color: "#ff9d90" }}>
              {error}
            </p>
          ) : null}
          <div className="rr-cta-row">
            {sessionId ? (
              <Link className="rr-btn-primary" href={`/intake?session_id=${encodeURIComponent(sessionId)}`}>
                Open intake form
              </Link>
            ) : (
              <span className="rr-btn-primary" aria-disabled="true">
                Missing order reference
              </span>
            )}
            <Link className="rr-btn-ghost" href="/">
              Back to site
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
