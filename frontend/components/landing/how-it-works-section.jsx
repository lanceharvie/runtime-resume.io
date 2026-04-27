export default function HowItWorksSection() {
  const steps = [
    ["01", "Order & Pay", "Choose your tier and complete secure payment."],
    ["02", "Upload & Brief", "Submit your resume and a short intake form."],
    ["03", "Expert Review", "I audit, rewrite, and quality-check the work personally."],
    ["04", "Receive & Revise", "Delivery lands in your inbox, with revision handling where included."]
  ]

  return (
    <section className="rr-section">
      <div className="rr-container">
        <div className="rr-eyebrow">How it works</div>
        <h2 className="rr-title">Simple steps, clear delivery, and direct recruiter review.</h2>
        <div className="rr-timeline">
          {steps.map(([index, title, copy]) => (
            <div key={index} className="rr-step">
              <div className="rr-step-index">{index}</div>
              <div className="rr-step-title">{title}</div>
              <div className="rr-step-copy">{copy}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
