export default function FitSection() {
  const yesItems = [
    "You are applying for roles and not hearing back.",
    "You are a strong engineer but your resume does not reflect it.",
    "You are moving between embedded sub-domains and need the narrative repositioned.",
    "You want honest recruiter-level feedback rather than generic advice."
  ]
  const noItems = [
    "You work outside of tech and you want a generalist service.",
    "You only want visual prettification without changing the substance."
  ]

  return (
    <section className="rr-section alt">
      <div className="rr-container">
        <div className="rr-eyebrow">Who this is for</div>
        <h2 className="rr-title">This service is deliberately narrow. That is what makes it credible.</h2>
        <div className="rr-check-grid">
          <div className="rr-card rr-check-panel">
            <div className="rr-panel-title">This is for you if</div>
            <ul className="rr-check-list">
              {yesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rr-card rr-check-panel">
            <div className="rr-panel-title">This is not for you if</div>
            <ul className="rr-check-list no">
              {noItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
