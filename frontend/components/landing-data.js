export const tiers = [
  {
    slug: "signal-check",
    name: "Signal Check",
    price: 149,
    turnaround: "48-hour turnaround",
    copy: "A written audit that shows where your resume is getting screened out and what needs fixing first.",
    points: [
      "Scored across 5 dimensions",
      "3 priority recommendations",
      "Recruiter-side comparison to market expectations",
      "PDF report, not generic notes"
    ]
  },
  {
    slug: "full-rewrite",
    name: "Full Rewrite",
    price: 349,
    turnaround: "5-business-day turnaround",
    featured: true,
    copy: "A full rebuild of your resume in ATS-clean format with niche-specific positioning and one revision round.",
    points: [
      "Everything in Signal Check",
      "Full resume rewrite",
      "Word + PDF delivery",
      "Cover letter template included"
    ]
  },
  {
    slug: "presence-package",
    name: "Presence Package",
    price: 595,
    turnaround: "Priority 3-business-day turnaround",
    copy: "Full resume rewrite plus LinkedIn overhaul and a strategy call for senior or transition-stage engineers.",
    points: [
      "Everything in Full Rewrite",
      "LinkedIn rewrite",
      "30-minute strategy call",
      "Priority handling"
    ]
  }
]

export const addons = [
  { slug: "express-24h", name: "Express 24hr turnaround", price: 99 },
  { slug: "second-revision", name: "Second revision round", price: 79 },
  { slug: "us-market-adaptation", name: "US market adaptation", price: 79 }
]
