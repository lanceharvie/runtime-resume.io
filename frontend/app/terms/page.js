const SECTIONS = [
  {
    title: "Service scope",
    body:
      "RunTime Resume provides recruiter-led resume review, rewrite, positioning, and related career document services. The service is designed to improve clarity, positioning, and market readiness. It is not legal, migration, financial, or employment advice."
  },
  {
    title: "Client responsibility",
    body:
      "You are responsible for providing accurate source material, including your current resume, work history, target roles, geography, and any factual corrections needed during the process. RunTime Resume does not independently verify employment history, qualifications, or claimed achievements."
  },
  {
    title: "Turnaround",
    body:
      "Published turnaround times apply from the point the required intake and source files are received, not merely from the time of payment. If the intake is incomplete or clarification is required, delivery timing may extend accordingly."
  },
  {
    title: "Revisions",
    body:
      "Unless otherwise stated in the purchased tier, the service includes one reasonable revision round focused on alignment, factual correction, or wording refinement. Revisions do not include unlimited rewrites, a change of target direction after work has commenced, or a full reset based on new source material that was not originally supplied. Additional revision work may be quoted separately."
  },
  {
    title: "Refund policy",
    body:
      "Refunds are not offered once substantive work has started. If a purchase is made and the client has not submitted the required intake or source files, a refund may be considered at discretion, less any payment processing fees or other non-recoverable costs. If RunTime Resume determines after purchase that the case is materially out of scope, a full or partial refund may be offered at discretion."
  },
  {
    title: "No guarantee of interviews or employment",
    body:
      "RunTime Resume does not guarantee interviews, shortlist outcomes, offers, visa outcomes, salary changes, recruiter response rates, or employment of any kind. Hiring decisions depend on market conditions, role competition, interview performance, geography, compensation alignment, experience depth, and factors beyond the scope of the service."
  },
  {
    title: "Fit and refusal of service",
    body:
      "RunTime Resume may decline or cancel work where the candidate profile is outside scope, where the source material is misleading or incomplete, or where the requested work would require fabrication, exaggeration, or misleading representation."
  },
  {
    title: "Delivery and file format",
    body:
      "Deliverables may include PDF, Word-compatible, or plain-text outputs depending on the purchased service. It is the client’s responsibility to review delivered files promptly and raise any factual corrections within a reasonable period after delivery."
  },
  {
    title: "Limitation of liability",
    body:
      "To the maximum extent permitted by law, RunTime Recruitment and RunTime Resume are not liable for indirect, consequential, incidental, or business-loss damages arising from use of the service or reliance on any deliverable. Total liability is limited to the amount paid for the specific service giving rise to the claim."
  }
]

export default function TermsPage() {
  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Terms</div>
          <h1 className="rr-title">Terms of service</h1>
          <p className="rr-copy">
            These terms apply to RunTime Resume services provided by RunTime Recruitment. By purchasing a
            review, rewrite, or related add-on, you agree to the service terms below.
          </p>
        </div>
      </section>

      <section className="rr-section">
        <div className="rr-container" style={{ display: "grid", gap: "2.5rem" }}>
          {SECTIONS.map((section) => (
            <article key={section.title} style={{ display: "grid", gap: "0.9rem" }}>
              <h2 style={{ margin: 0 }}>{section.title}</h2>
              <p style={{ margin: 0 }}>{section.body}</p>
            </article>
          ))}

          <article style={{ display: "grid", gap: "0.9rem" }}>
            <h2 style={{ margin: 0 }}>Contact</h2>
            <p style={{ margin: 0 }}>
              Questions about these terms can be sent through the contact page or by email to{" "}
              <a href="mailto:lance@runtimerec.com">lance@runtimerec.com</a>.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
