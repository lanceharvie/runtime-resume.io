export default function ProblemSection() {
  const problems = [
    {
      num: "01",
      title: "ATS rejects you before a recruiter sees your name",
      body: "Because your formatting breaks the parse and your most relevant keywords are either missing or buried."
    },
    {
      num: "02",
      title: "Your skills are buried",
      body: "You lead with a responsibilities list instead of the systems, tools, and outcomes that actually matter."
    },
    {
      num: "03",
      title: "You are using the wrong keywords",
      body: "In this market, phrasing and placement matter. Generic wording weakens signal even when the skills are real."
    }
  ]

  return (
    <section className="rr-section alt">
      <div className="rr-container">
        <div className="rr-eyebrow">The problem</div>
        <h2 className="rr-title">Good engineers get screened out every day. Not because of their skills.</h2>
        <div className="rr-grid-3">
          {problems.map((item) => (
            <div key={item.num} className="rr-problem-cell">
              <div className="rr-problem-num">{item.num}</div>
              <div className="rr-problem-title">{item.title}</div>
              <div className="rr-problem-body">{item.body}</div>
            </div>
          ))}
        </div>
        <div className="rr-quote">
          I review hundreds of engineering resumes a year. The same fixable mistakes appear over and over and most
          candidates have no idea they are making them.
        </div>
      </div>
    </section>
  )
}
