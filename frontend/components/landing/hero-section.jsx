import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="rr-hero">
      <div className="rr-container rr-hero-grid">
        <div>
          <div className="rr-hero-eyebrow">Recruiter-side resume review for hardware engineers</div>
          <h1>
            Your Resume Is Being Screened Out Before a <em>Human</em> Reads It.
          </h1>
          <p className="rr-hero-sub">
            I&apos;m a specialist technical recruiter. I see what happens to firmware, embedded, and FPGA
            engineering resumes on the other side of the process. Let me fix yours.
          </p>
          <div className="rr-cta-row">
            <Link href="/order?tier=full-rewrite" className="rr-btn-primary">
              Get My Resume Reviewed — From $149
            </Link>
            <a href="#pricing" className="rr-btn-ghost">
              See what&apos;s included
            </a>
          </div>
          <div className="rr-trust-strip">
            <div className="rr-trust-item">Recruiter-side insight, not career-coach advice</div>
            <div className="rr-trust-item">Placed 100s of engineers in AU & USA</div>
            <div className="rr-trust-item">Embedded · Firmware · FPGA · Robotics · DSP</div>
            <div className="rr-trust-item">27,000 engineers in my network</div>
          </div>
        </div>

        <div className="rr-card rr-hero-portrait">
          <div className="rr-portrait-photo-wrap">
            <img src="/lance-portrait.png" alt="Lance" className="rr-portrait-photo" />
          </div>
          <div className="rr-portrait-meta">
            <p className="rr-portrait-name">Lance</p>
            <p className="rr-portrait-role">Founder, RunTime Recruitment</p>
          </div>
        </div>
      </div>
    </section>
  )
}
