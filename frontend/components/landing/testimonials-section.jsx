export default function TestimonialsSection() {
  const testimonials = [
    {
      copy: "The biggest difference was that the rewrite sounded like an engineer wrote it, not a marketer. Recruiters started replying within two weeks.",
      meta: "Senior Firmware Engineer, Melbourne"
    },
    {
      copy: "The audit was blunt in the right way. It showed exactly why my FPGA work was getting lost behind generic project language.",
      meta: "FPGA Engineer, Sydney"
    },
    {
      copy: "What stood out was the recruiter perspective. It was obvious this had been written by someone who actually screens technical resumes.",
      meta: "Robotics Engineer, Austin"
    }
  ]

  return (
    <section className="rr-section">
      <div className="rr-container">
        <div className="rr-eyebrow">Social proof</div>
        <h2 className="rr-title">What engineers should feel after the rewrite: better signal, less ambiguity, more response.</h2>
        <div className="rr-testimonials">
          {testimonials.map((item) => (
            <div key={item.meta} className="rr-card rr-testimonial">
              <div className="rr-testimonial-copy">{item.copy}</div>
              <div className="rr-testimonial-meta">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
