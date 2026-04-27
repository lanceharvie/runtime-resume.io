const faqs = [
  ["How long does it take?", "Signal Check is 48 hours, Full Rewrite is 5 business days, and Presence Package is priority 3 business days."],
  ["Will you actually write my resume or use AI?", "I review and rewrite your resume based on direct experience of what hiring managers and technical recruiters actually look for."],
  ["What formats do you deliver in?", "Word and PDF for rewrite tiers, plus a written PDF audit for Signal Check."],
  ["Do you guarantee interviews?", "No. The service improves resume quality and market positioning. It does not guarantee interviews or placement."],
  ["Can I upgrade later?", "Yes. Signal Check can be upgraded into a rewrite path if you decide you want the document rebuilt."],
  ["Can you help for the US market?", "Yes. There is a US adaptation add-on for candidates repositioning from the Australian market."]
]

export default function FaqSection() {
  return (
    <section className="rr-section alt">
      <div className="rr-container">
        <div className="rr-eyebrow">FAQ</div>
        <h2 className="rr-title">The objections most candidates have before they buy are predictable. Answer them clearly.</h2>
        <div className="rr-faq">
          {faqs.map(([q, a]) => (
            <div key={q} className="rr-card rr-faq-item">
              <div className="rr-faq-q">{q}</div>
              <div className="rr-faq-a">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
