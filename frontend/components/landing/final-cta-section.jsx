import Link from "next/link"

export default function FinalCtaSection() {
  return (
    <section className="rr-section rr-final">
      <div className="rr-container">
        <div className="rr-eyebrow">Final CTA</div>
        <h2 className="rr-title">Your next role starts with a resume that gets you in the room.</h2>
        <p className="rr-copy">
          Secure online payment. All major cards accepted. Invoices available where required.
        </p>
        <div className="rr-cta-row justify-center">
          <Link href="/order?tier=signal-check" className="rr-btn-primary">
            Start With a Signal Check — $149
          </Link>
          <Link href="/order?tier=full-rewrite" className="rr-btn-ghost">
            Book a Full Rewrite — $349
          </Link>
        </div>
      </div>
    </section>
  )
}
