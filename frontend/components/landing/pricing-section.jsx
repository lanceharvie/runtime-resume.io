import Link from "next/link"
import { tiers } from "@/components/landing-data"

export default function PricingSection() {
  return (
    <section id="pricing" className="rr-section alt">
      <div className="rr-container">
        <div className="rr-eyebrow">Service tiers</div>
        <h2 className="rr-title">Three ways to fix the resume problem, depending on how much you want rebuilt.</h2>
        <div className="rr-grid-3">
          {tiers.map((tier) => (
            <div key={tier.slug} className={`rr-tier-card ${tier.featured ? "featured" : ""}`}>
              {tier.featured && <div className="rr-tier-badge">Most popular</div>}
              <div className="rr-tier-name">{tier.name}</div>
              <div className="rr-tier-price">From ${tier.price} USD</div>
              <div className="rr-tier-copy">{tier.copy}</div>
              <div className="rr-tier-points">
                {tier.points.map((point) => (
                  <div key={point}>{point}</div>
                ))}
              </div>
              <div className="rr-tier-meta">{tier.turnaround}</div>
              <Link href={`/order?tier=${tier.slug}`} className="rr-btn-primary">
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
