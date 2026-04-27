import HeroSection from "@/components/landing/hero-section"
import ProblemSection from "@/components/landing/problem-section"
import CredibilitySection from "@/components/landing/credibility-section"
import PricingSection from "@/components/landing/pricing-section"
import HowItWorksSection from "@/components/landing/how-it-works-section"
import FitSection from "@/components/landing/fit-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import FaqSection from "@/components/landing/faq-section"
import FinalCtaSection from "@/components/landing/final-cta-section"

export default function HomePage() {
  return (
    <main className="rr-shell">
      <HeroSection />
      <ProblemSection />
      <CredibilitySection />
      <PricingSection />
      <HowItWorksSection />
      <FitSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  )
}
