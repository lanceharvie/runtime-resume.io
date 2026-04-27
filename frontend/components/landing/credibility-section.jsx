export default function CredibilitySection() {
  const bullets = [
    "Founded RunTime Recruitment, a specialist technical agency across Australia and the USA.",
    "Placed engineers in embedded, firmware, FPGA, robotics, power electronics, and DSP.",
    "Sees which resumes clients actually respond to and which ones get filed silently.",
    "Built internal AI tooling specifically for engineering resume analysis."
  ]

  return (
    <section className="rr-section">
      <div className="rr-container">
        <div className="rr-eyebrow">Why me</div>
        <h2 className="rr-title">
          You&apos;re not getting advice from a career coach. You&apos;re getting it from someone who screens engineers
          for a living.
        </h2>
        <div className="rr-cred">
          <img src="/lance-portrait.png" alt="Lance" className="rr-avatar" />
          <div>
            <div className="mb-2 text-base">Lance</div>
            <div className="rr-cred-role">Founder, RunTime Recruitment</div>
            <div className="rr-list">
              {bullets.map((bullet) => (
                <div key={bullet} className="rr-list-item">
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            <div className="rr-quote mt-6">
              Most resume services are written for ATS algorithms or HR generalists. I write for the technical hiring
              manager who is already irritated that they have to hire.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
