import Link from "next/link"
import ContactForm from "@/components/contact-form"

const inScope = [
  "You are an engineer or technical specialist and you are unsure whether your background fits the service.",
  "You work in embedded, firmware, FPGA, DSP, robotics, electronics, hardware, or adjacent technical domains.",
  "You are considering a Signal Check or Rewrite and want to confirm the right tier before paying.",
  "You are moving between technical sub-domains and need to know whether repositioning is realistic."
]

const notInScope = [
  "You want a generalist resume service for non-technical roles.",
  "You only want cosmetic formatting without recruiter-side content changes.",
  "You are looking for guaranteed interviews or job placement promises.",
  "You need full career coaching rather than resume positioning and rewrite work."
]

export default function ContactPage() {
  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Contact</div>
          <h1 className="rr-title">Ask before you buy if the fit is unclear.</h1>
          <p className="rr-copy">
            If you are not sure whether your background is in scope, use the form below. This page is for quick fit
            checks, direct contact, and clarity before purchase.
          </p>

          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/pricing">
              Review pricing first
            </Link>
            <Link className="rr-btn-ghost" href="/order?tier=signal-check">
              Start with Signal Check
            </Link>
          </div>

          <div className="rr-order-grid" style={{ marginTop: "2rem", alignItems: "start" }}>
            <ContactForm />

            <div className="rr-card rr-check-panel">
              <div className="rr-panel-title">This is likely in scope if</div>
              <ul className="rr-check-list">
                {inScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rr-order-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
            <div className="rr-card rr-check-panel">
              <div className="rr-panel-title">This is likely not in scope if</div>
              <ul className="rr-check-list no">
                {notInScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Before you send</div>
              <div className="rr-order-summary-row"><span>Best use</span><span>Fit check before purchase</span></div>
              <div className="rr-order-summary-row"><span>Include</span><span>Target role, niche, geography, seniority</span></div>
              <div className="rr-order-summary-row"><span>Helpful context</span><span>LinkedIn URL and current resume if available</span></div>
              <div className="rr-order-summary-row"><span>Fastest path</span><span>Go straight to order if the fit is already clear</span></div>
              <p className="rr-note" style={{ marginTop: "1rem" }}>
                If the fit is obvious, you do not need to contact first. If it is not obvious, send enough context to judge quickly whether the service is the right one for you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
