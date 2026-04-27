import IntakeForm from "@/components/intake-form"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"

export default async function IntakePage({ searchParams }) {
  const params = await searchParams
  const sessionId = typeof params?.session_id === "string" ? params.session_id : ""

  if (!sessionId) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Intake</div>
            <h1 className="rr-title">Missing session reference.</h1>
            <p className="rr-copy">Open the intake from your order success page or confirmation email.</p>
          </div>
        </section>
      </main>
    )
  }

  const order = await getOrderBySessionId(sessionId)
  const existingIntake = await getIntakeSubmission(sessionId)

  if (!order) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Intake</div>
            <h1 className="rr-title">Order not found.</h1>
            <p className="rr-copy">The session reference is invalid or the order has not been recorded yet.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="rr-shell">
      <section className="rr-order-shell">
        <div className="rr-container">
          <div className="rr-eyebrow">Intake</div>
          <h1 className="rr-title">Submit the brief that drives the review and rewrite.</h1>
          <p className="rr-copy mb-8">
            This is the operational handoff after payment. The more specific the inputs are, the better the first pass will be.
          </p>
          <IntakeForm sessionId={sessionId} order={order} existingIntake={existingIntake} />
        </div>
      </section>
    </main>
  )
}
