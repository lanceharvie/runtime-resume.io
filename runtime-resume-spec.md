# RunTime Resume — Technical & Business Specification
**Service**: Specialist Resume Review & Rewriting for Hardware Engineers  
**Brand**: RunTime Resume (sub-brand of RunTime Recruitment)  
**Owner**: Lance, RunTime Recruitment  
**Version**: 1.0  
**Date**: April 2026

---

## 1. Service Overview

### 1.1 Positioning Statement

> *"Written by a recruiter who places engineers like you — not a copywriter who's never read a datasheet."*

RunTime Resume is a premium resume review and rewriting service exclusively for engineers working in embedded systems, firmware, FPGA, robotics, DSP, and hardware design. The service is operated by Lance, founder of RunTime Recruitment — a specialist technical recruitment agency placing engineers across Australia and the USA.

The credibility angle is non-negotiable: every piece of marketing must lead with **recruiter-side insight**, not generic resume advice. The service sells access to the same evaluation lens that hiring managers and technical recruiters use when screening candidates.

### 1.2 Why This Works

- Niche specificity → candidates feel genuinely understood
- Recruiter authority → perceived value far above generic services
- Existing audience of 27,000 engineers → no cold-start problem
- AI-assisted internal tooling → high throughput without quality loss
- Placement pipeline synergy → the service feeds RunTime's core business

---

## 2. Service Tiers

### Tier 1 — Signal Check · $149 AUD
**What the candidate gets:**
- Written audit report (PDF, ~600–900 words)
- Scored across 5 dimensions: ATS compatibility, technical clarity, relevance weighting, career narrative, format/readability
- 3 priority recommendations with specific examples from their resume
- Comparison to what RunTime clients actually look for in their niche
- 48-hour turnaround (business days)

**What this is not:** A rewrite. A coaching call. A guarantee of placement.

**Who it's for:** Engineers who are unsure if their resume is holding them back and want expert eyes before they apply.

---

### Tier 2 — Full Rewrite · $347 AUD
**What the candidate gets:**
- Everything in Tier 1
- Full rewrite of resume in RunTime-branded Word + PDF format
- ATS-optimised formatting (clean parse, correct heading hierarchy, no tables/columns)
- One revision round within 7 days of delivery
- Role-specific keyword optimisation (embedded, RTOS, FPGA toolchain, etc.)
- Cover letter template (role-agnostic, structured for their seniority level)
- 5-business-day turnaround

**Who it's for:** Engineers who know their resume isn't working and want it rebuilt correctly.

---

### Tier 3 — Presence Package · $597 AUD
**What the candidate gets:**
- Everything in Tier 2
- Full LinkedIn profile overhaul (headline, about, experience rewrite)
- LinkedIn optimisation guide (specific to technical/engineering profiles)
- 30-minute strategy call with Lance (video or phone) — market positioning, salary benchmarking, job search approach
- Priority 3-business-day turnaround
- Added to RunTime's active candidate pool (with permission)

**Who it's for:** Senior engineers or those making a career transition who want a full repositioning.

---

### Add-ons
| Add-on | Price |
|---|---|
| Express 24hr turnaround (Tier 1 or 2) | +$99 |
| Second revision round | +$79 |
| FPGA/DSP specialist keyword audit | +$49 |
| US market adaptation (from AU resume) | +$79 |

---

## 3. Quality Standards & Delivery Process

### 3.1 Intake Process

1. **Order confirmation** — Stripe payment + automated confirmation email
2. **Intake form** (Typeform or similar):
   - Resume upload (PDF or Word)
   - LinkedIn URL (optional but recommended)
   - Target roles / job titles
   - Target companies or sectors (optional)
   - Key achievements they feel are underrepresented
   - Years of experience + seniority level
   - Geographic preference (AU / USA / both)
   - Specific concerns ("I never hear back", "I get interviews but no offers", etc.)
3. **Acknowledgement email** — confirms receipt, expected delivery date, and what to expect

### 3.2 Internal Workflow (with AI tooling)

**Tier 1 (Signal Check):**
1. Resume ingested via RunTime CV Formatter / pdfplumber
2. CIFS-style audit run: tenure patterns, role relevance, keyword density, formatting flags
3. Lance reviews AI output, adds recruiter-layer context, edits to voice
4. PDF audit report generated and emailed

**Tier 2 (Full Rewrite):**
1. Intake + AI audit as above
2. Rewrite drafted using Qwen2.5 with custom prompt (niche-specific, seniority-aware)
3. Lance reviews, edits heavily for voice, accuracy, and positioning
4. RunTime-branded Word + PDF output via CV Formatter pipeline
5. Delivered via email with revision instructions

**Tier 3 (Presence Package):**
1. All of above
2. LinkedIn rewrite drafted, reviewed, delivered as copy-paste guide
3. Calendar link sent for 30-minute call (Calendly)
4. Call notes summarised and sent post-session

### 3.3 Quality Bar

- Every resume must pass Lance's personal read before delivery — no pure AI output shipped
- All rewrites must be in first person, past tense for previous roles, ATS-clean format
- No templates recycled across clients in the same sub-niche
- Revision turnaround: 48 hours from revision request

---

## 4. Website UX Specification

### 4.1 Domain & Branding

- **Domain**: `runtimeresume.com.au` (primary) + `runtimeresume.com` (redirect)
- **Sub-brand**: RunTime Resume — sits visually under RunTime Recruitment umbrella
- **Colour palette**: 
  - Background: `#1E1E1E` (RunTime near-black)
  - Primary accent: `#C0392B` (RunTime red)
  - Secondary: `#F5F0EB` (warm off-white for text)
  - Tertiary: `#2C2C2C` (card surfaces)
- **Typography**:
  - Display: Playfair Display (authority, editorial)
  - Body: IBM Plex Mono (technical credibility, niche signal)
- **Tone**: Confident, direct, recruiter-not-coach. No fluff. No corporate speak.

### 4.2 Page Architecture

```
/ (Landing page — primary conversion)
/how-it-works
/pricing
/about
/order (Stripe checkout flow)
/order/success
/blog (SEO — "why embedded engineers get screened out" etc.)
/contact
```

### 4.3 Landing Page — Section-by-Section

---

#### SECTION 1: Hero

**Headline (H1):**  
> Your Resume Is Being Screened Out Before a Human Reads It.

**Sub-headline:**  
> I'm a specialist technical recruiter. I see what happens to firmware, embedded, and FPGA engineering resumes on the other side of the process. Let me fix yours.

**CTA (primary):** `Get My Resume Reviewed — From $149`  
**CTA (secondary, text link):** `See what's included ↓`

**Visual:** Lance's professional photo — strong, direct eye contact. Not stock. Not an avatar. This is a credibility page; the human face is the hero element.

**Trust strip below CTA:**
- ✓ Recruiter-side insight, not career-coach advice  
- ✓ Placed 100s of engineers in AU & USA  
- ✓ Embedded · Firmware · FPGA · Robotics · DSP  
- ✓ 27,000 engineers in my network  

---

#### SECTION 2: The Problem (Empathy / Hook)

**Headline:** "Good Engineers Get Screened Out Every Day. Not Because of Their Skills."

3-column layout, each with a short punchy statement:

| Column 1 | Column 2 | Column 3 |
|---|---|---|
| **ATS rejects you before a recruiter sees your name** — because your formatting breaks the parse | **Your skills are buried** — you lead with a responsibilities list instead of outcomes | **You're using the wrong keywords** — "embedded C" and "C for embedded" are treated differently |

Short paragraph beneath:  
> "I review hundreds of engineering resumes a year. The same fixable mistakes appear over and over — and most candidates have no idea they're making them."

---

#### SECTION 3: Why Me (Credibility)

**Headline:** "You're Not Getting Advice From a Career Coach. You're Getting It From Someone Who Screens Engineers For a Living."

Split layout — photo left, copy right:

- Founded RunTime Recruitment — specialist technical agency across Australia and the USA
- Placed engineers in embedded, firmware, FPGA, robotics, power electronics, DSP
- 27,000 engineers in my LinkedIn network — I know what this community looks like on paper
- I see which resumes clients actually respond to — and which ones get filed silently
- I've built AI tooling specifically for engineering resume analysis

**Quote/pull statement:**  
> *"Most resume services are written for ATS algorithms or HR generalists. I write for the technical hiring manager who's already irritated that they have to hire."*

---

#### SECTION 4: The Service Tiers

Clean card layout, 3 columns. Each card:
- Tier name + price (prominent)
- 3–4 bullet benefits
- Turnaround time
- CTA button → direct to Stripe / order form

Highlight Tier 2 (Full Rewrite) as "Most Popular" with a red accent border.

---

#### SECTION 5: How It Works

4-step horizontal timeline:

1. **Order & Pay** — Choose your tier, pay securely via Stripe
2. **Upload & Brief** — Submit your resume + short intake form (5 min)
3. **Expert Review** — I audit, rewrite, and quality-check everything personally
4. **Receive & Revise** — Delivered to your inbox. Revision round included in Tiers 2 & 3.

---

#### SECTION 6: Who This Is For

**Headline:** "This Service Is For You If..."

Checklist format:
- ✓ You're applying for roles and not hearing back
- ✓ You're a strong engineer but your resume doesn't reflect it
- ✓ You're transitioning from one embedded sub-domain to another (e.g. bare-metal to RTOS)
- ✓ You're targeting the Australian or US market and don't know what's expected
- ✓ You've been in the same role for 5+ years and haven't updated your resume in years
- ✓ You want honest recruiter-level feedback, not generic advice

**And this is NOT for you if:**
- ✗ You work in software, web, or data (not my domain — I won't do a good job for you)
- ✗ You want someone to just "pretty it up" without changing the substance

(This specificity builds trust and filters out bad-fit clients.)

---

#### SECTION 7: Testimonials / Social Proof

Initially: 2–3 strong testimonials from engineers Lance has placed or helped directly. Can be paraphrased with permission. Photo + name + role + company (or "Senior Firmware Engineer, Medical Devices, Melbourne").

Long-term: Collect testimonials from service clients systematically after delivery.

---

#### SECTION 8: FAQ

- How long does it take?
- Will you actually write my resume or use AI?
- What formats do you deliver in?
- What if I'm not happy with the result?
- Can I upgrade from Tier 1 to Tier 2 later?
- Do you guarantee interviews?
- What if I'm in the USA, not Australia?
- Can you place me after the service?

---

#### SECTION 9: Final CTA

**Headline:** "Your Next Role Starts With a Resume That Gets You In The Room."

**CTA:** `Start With a Signal Check — $149`  
**Secondary CTA:** `Book a Full Rewrite — $347`

Small print: Secure payment via Stripe · All major cards accepted · Invoices available for tax

---

### 4.4 Order Flow UX

1. User clicks CTA → lands on `/order`
2. Tier pre-selected from which CTA they clicked
3. Tier switcher at top (easy upgrade/downgrade)
4. Add-on checkboxes (express, extra revision, etc.)
5. Order summary sidebar (live price update)
6. Stripe Checkout (hosted) — name, email, card
7. Post-payment redirect → `/order/success`
8. Success page: "You're booked. Check your email for next steps." + Typeform intake link embedded
9. Automated email sequence:
   - Immediate: Confirmation + intake form link
   - +2 hours (if intake not submitted): Reminder
   - On delivery: "Your resume is ready" with download + revision instructions
   - +7 days: "How did it go?" (review request)

---

### 4.5 Tech Stack

| Component | Recommendation |
|---|---|
| Frontend | Next.js 15 (App Router) — consistent with runtimerec.com migration plan |
| Styling | Tailwind CSS + custom CSS variables for brand |
| Payments | Stripe Checkout (hosted) — simplest PCI-compliant path |
| Intake form | Typeform (embed post-payment) or custom Next.js form → stored in DB |
| Email | AWS SES (existing infrastructure) |
| Document delivery | S3 pre-signed URL in delivery email |
| Resume processing | FastAPI backend (existing RunTime stack) |
| CMS for blog | Payload CMS (consistent with runtimerec.com plan) |
| Analytics | Plausible (privacy-respecting, no cookie banner needed) |
| Hosting | Vercel (frontend) + existing Singapore VPS (backend API) |

---

## 5. Promotion Strategy

### 5.1 Phase 1: LinkedIn Organic Launch (Weeks 1–2)

**Goal:** First 5–10 paying clients from existing network at zero ad spend.

**Content sequence:**

**Post 1 — The Hook (Day 1):**  
Carousel or long-form post: *"I've reviewed 1,000+ engineering resumes. Here are the 5 mistakes firmware engineers make that get them screened out before a human reads their name."*  
End with: "I'm launching a resume review service for embedded engineers. DM me or link in bio."

**Post 2 — The Credibility Post (Day 3):**  
Behind-the-scenes: "Here's what a recruiter actually sees when your resume lands in our inbox" — screenshot of ATS-parsed resume (anonymised, yours or a dummy) showing what gets mangled.

**Post 3 — The Offer Post (Day 5):**  
Clean announcement post. Service name, tiers, price, link. Professional tone. No desperation.

**Post 4 — First Testimonial / Case Study (Week 2):**  
"I reviewed [engineer]'s resume last week. Here's what we changed and why." Before/after excerpt (with permission).

**Posting cadence ongoing:** 2–3x/week mixing educational content (resume tips for engineers), industry commentary, and periodic service promotion. 80/20 value-to-promotion ratio.

---

### 5.2 Phase 2: YouTube & Content Engine (Weeks 3–6)

**YouTube video series:**

1. *"Why embedded engineers get rejected before the interview"* (explainer, 8–12 min)
2. *"Live resume review: firmware engineer, 8 years experience"* (anonymised, screen-share)
3. *"ATS vs human reader: what your resume actually looks like"* (demonstration)
4. *"Salary negotiation for hardware engineers in Australia vs USA"* (adjacent value topic)

Each video ends with CTA to the service. Description links to `runtimeresume.com.au`.

**Repurpose strategy:**  
Each YouTube video → 3 LinkedIn clips → 1 LinkedIn article → 1 blog post → 3 Twitter/X threads

---

### 5.3 Phase 3: Paid Advertising (Month 2+)

#### LinkedIn Ads

**Campaign 1 — Awareness / Content Amplification**
- Boost best-performing organic posts (resume tips content)
- Target: Engineers with titles containing embedded, firmware, FPGA, robotics in AU + USA
- Budget: $20–$40/day
- Objective: Engagement / reach

**Campaign 2 — Direct Conversion**
- Single image or document ad
- Headline: *"Your Resume Is Being Screened Out Before a Human Reads It."*
- CTA: *"Get a Recruiter's Honest Assessment — From $149"*
- Target: 
  - Job titles: Embedded Engineer, Firmware Engineer, FPGA Engineer, Electronics Engineer, Hardware Engineer, Robotics Engineer
  - Locations: Australia + major US tech hubs (San Jose, Austin, Seattle, Boston)
  - Seniority: Mid to senior
- Budget: $40–$80/day
- Objective: Website conversions (Stripe checkout)

**Campaign 3 — Retargeting**
- Audience: Website visitors who didn't convert (LinkedIn Insight Tag)
- Ad: Objection-handling format — "Still thinking about it? Here's what's included."
- Budget: $15–$25/day

**Estimated LinkedIn CPC:** $8–$18 AUD in this niche. Target conversion rate: 2–4% of landing page visitors. At $347 average order value, need ~1 in 15–25 clicks to break even on ad spend.

---

#### Google Search Ads

**Target keywords:**
- `resume writing service engineers australia`
- `embedded engineer resume review`
- `firmware engineer resume help`
- `technical resume rewrite australia`
- `engineering resume writing specialist`

**Ad copy angle:** Lead with recruiter credibility and niche specificity.

**Budget:** $20–$40/day  
**Match type:** Phrase + exact only (avoid broad in a niche service)

---

#### Meta (Facebook/Instagram) — Optional Phase 3

Lower priority given audience is more LinkedIn-native. Test only if LinkedIn/Google show positive ROAS. If tested:
- Target by job title (Meta's engineering audience is thinner but cheaper)
- Use video creative (YouTube repurpose)
- Retargeting only initially

---

### 5.4 Referral & Partnership Strategy

**Engineer community groups:**
- Post in relevant LinkedIn groups (embedded systems, FPGA engineers, robotics)
- Engage in Reddit communities: r/embedded, r/FPGA, r/ECE, r/AustraliaEngineering
- IEEE member forums (Australia chapters)

**University partnerships:**
- Contact ECE department career services at RMIT, Monash, UQ, UNSW, UWA
- Offer a "graduate rate" ($99 Signal Check for final-year students) — builds pipeline, goodwill, and referrals

**Recruiter referral network:**
- Other generalist recruiters who encounter hardware engineers outside their expertise → refer to RunTime Resume, receive a 10% referral fee

---

### 5.5 Email Marketing

**List building:**
- Lead magnet: *"The Embedded Engineer's Resume Checklist"* — 1-page PDF, gated behind email opt-in on the website
- Existing RunTime candidate database (opt-in compliant)

**Nurture sequence (5 emails over 14 days post opt-in):**
1. Deliver checklist + brief intro to the service
2. "The 3 resume mistakes I see every single week" (educational)
3. "What a $400k/year embedded engineer's resume looks like" (aspirational)
4. "Before & after: how we repositioned a career-changer's resume" (social proof)
5. Soft offer: "Ready to get yours sorted?" with all tier options

---

## 6. Metrics & KPIs

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Website visitors/month | 500 | 2,000 |
| Landing page conversion rate | 2–3% | 3–5% |
| Orders/month | 10–15 | 40–60 |
| Average order value | $280 AUD | $320 AUD |
| Monthly revenue | $2,800–4,200 | $12,800–19,200 |
| LinkedIn post impressions | 50k/month | 150k/month |
| Email list size | 200 | 1,000 |
| Client satisfaction (5-star) | ≥90% | ≥92% |
| Placement pipeline candidates added | 5–10 | 20–30 |

---

## 7. Operational Constraints & Capacity

- Lance reviews all output personally before delivery — this is the quality guarantee
- Maximum sustainable throughput without quality degradation: ~8–10 Tier 2 rewrites/week
- AI tooling (CV Formatter, CIFS audit) reduces per-resume time to ~45–60 min for Tier 2
- Tier 1 (audit only): ~20–30 min per review
- At capacity: consider training Simon or a dedicated resume writer on the RunTime methodology

---

## 8. Legal & Compliance

- Clear terms on the website: no guarantee of employment or interviews
- Refund policy: revision round included; refunds at Lance's discretion if expectation clearly not met
- Privacy policy: resume data not stored beyond delivery; not shared with third parties without consent
- GDPR/Privacy Act compliant intake and data handling
- Clear disclosure on website that RunTime Resume is operated by RunTime Recruitment (no conflict of interest surprises)

---

## 9. Launch Checklist

- [ ] Domain registered: `runtimeresume.com.au`
- [ ] Next.js site built and deployed to Vercel
- [ ] Stripe products created (3 tiers + add-ons)
- [ ] Typeform intake created and tested
- [ ] AWS SES email templates configured (confirmation, delivery, follow-up)
- [ ] LinkedIn launch post sequence drafted and scheduled
- [ ] Lead magnet PDF (checklist) designed and gated
- [ ] Google Analytics / Plausible installed
- [ ] LinkedIn Insight Tag installed (for retargeting)
- [ ] First 3 YouTube scripts drafted
- [ ] Terms of service and privacy policy pages live
- [ ] Test order placed end-to-end (Stripe test mode)

---

*Prepared for RunTime Recruitment internal use. Not for distribution.*



---

## Appendix A — Landing Page HTML Prototype

Complete, self-contained HTML implementation matching the approved dark-theme design. Use as the direct visual and structural reference when building Next.js components.

**Implementation notes for the agent:**
- Convert each `<section>` into a named Next.js component (`HeroSection`, `ProblemSection`, `PricingSection`, etc.)
- CSS custom properties map to `tailwind.config.js` brand tokens: `--bg-page: #1E1E1E`, `--bg-surface: #2C2C2C`, `--bg-raised: #333333`, `--red: #C0392B`, `--text-primary: #F5F0EB`
- The `.cred-avatar` div has an inline comment showing where to swap in Lance's photo — use `next/image`
- `href="/order?tier=..."` links map to the `/order` page with a `tier` query param pre-selecting the Stripe product
- Move Google Font imports to `app/layout.tsx` via `next/font/google`
- `@media (max-width: 768px)` breakpoints map to Tailwind's `md:` prefix

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RunTime Resume — Specialist Resume Service for Hardware Engineers</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-page:      #1E1E1E;
  --bg-surface:   #2C2C2C;
  --bg-raised:    #333333;
  --text-primary: #F5F0EB;
  --text-secondary: #A8A49E;
  --text-muted:   #666660;
  --border:       rgba(245,240,235,0.09);
  --border-mid:   rgba(245,240,235,0.16);
  --red:          #C0392B;
  --font-mono:    'IBM Plex Mono', monospace;
  --font-serif:   'Playfair Display', serif;
  --radius:       2px;
}

body {
  font-family: var(--font-mono);
  background: var(--bg-page);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* NAV */
.rr-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 40px;
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.rr-logo {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: var(--text-primary);
  text-decoration: none;
}
.rr-logo span { color: var(--red); }
.rr-nav-links {
  display: flex;
  gap: 24px;
  list-style: none;
  align-items: center;
}
.rr-nav-links a {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  text-decoration: none;
}
.rr-nav-links a:hover { color: var(--text-primary); }
.nav-cta {
  background: var(--red) !important;
  color: #fff !important;
  padding: 6px 14px;
  border-radius: var(--radius);
  font-size: 11px;
  letter-spacing: 0.06em;
  font-weight: 500;
}

/* BUTTONS */
.btn-primary {
  display: inline-block;
  background: var(--red);
  color: #fff;
  padding: 12px 22px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.88; }
.btn-ghost {
  display: inline-block;
  background: transparent;
  color: var(--text-secondary);
  padding: 12px 18px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.04em;
  border: 0.5px solid var(--border-mid);
  border-radius: var(--radius);
  cursor: pointer;
  text-decoration: none;
}
.btn-ghost:hover { border-color: var(--text-secondary); }

/* SECTIONS */
section {
  padding: 52px 40px;
  border-bottom: 0.5px solid var(--border);
  background: var(--bg-page);
}
section:nth-child(even) { background: var(--bg-surface); }
.section-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}
section h2 {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.22;
  color: var(--text-primary);
  margin-bottom: 24px;
  max-width: 600px;
}

/* HERO */
.hero {
  padding: 60px 40px 52px;
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
}
.hero-eyebrow {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--red);
  font-weight: 500;
  margin-bottom: 20px;
}
.hero h1 {
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 700;
  line-height: 1.16;
  color: var(--text-primary);
  max-width: 640px;
  margin-bottom: 20px;
}
.hero h1 em { font-style: italic; color: var(--red); }
.hero-sub {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-secondary);
  max-width: 520px;
  margin-bottom: 32px;
}
.cta-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.trust-strip { display: flex; flex-wrap: wrap; gap: 20px; }
.trust-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}
.trust-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--red);
  flex-shrink: 0;
}

/* PROBLEM */
.problem-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 0.5px solid var(--border);
  margin-bottom: 22px;
}
.problem-cell { background: var(--bg-surface); padding: 20px 18px; }
.cell-num { font-size: 11px; color: var(--red); font-weight: 500; margin-bottom: 9px; letter-spacing: 0.06em; }
.cell-title { font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 7px; line-height: 1.4; }
.cell-body { font-size: 11px; color: var(--text-secondary); line-height: 1.65; }
.rr-quote {
  border-left: 2px solid var(--red);
  padding: 13px 18px;
  background: var(--bg-raised);
  font-size: 13px;
  font-style: italic;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* CREDIBILITY */
.cred-layout {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 26px;
  align-items: start;
  max-width: 680px;
}
.cred-avatar {
  width: 72px; height: 72px;
  border-radius: var(--radius);
  background: rgba(24,95,165,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: #7ab3e0;
  flex-shrink: 0;
  border: 0.5px solid var(--border);
  /* REPLACE with <img src="/images/lance.jpg" style="width:72px;height:72px;border-radius:2px;object-fit:cover;"> */
}
.cred-name { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 3px; }
.cred-role { font-size: 10px; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
.cred-bullets { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.cred-bullets li { font-size: 12px; color: var(--text-secondary); line-height: 1.55; display: flex; gap: 10px; }
.cred-bullets li::before { content: '—'; color: var(--red); flex-shrink: 0; font-weight: 300; }

/* TIERS */
.tiers-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 0.5px solid var(--border);
}
.tier-card { background: var(--bg-surface); padding: 22px 18px; }
.tier-card.featured { background: var(--bg-raised); }
.tier-badge {
  display: inline-block;
  background: var(--red);
  color: #fff;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 1px;
  margin-bottom: 10px;
}
.tier-name { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 7px; }
.tier-price { font-family: var(--font-serif); font-size: 30px; font-weight: 700; color: var(--text-primary); line-height: 1; margin-bottom: 5px; }
.tier-price span { font-size: 13px; font-family: var(--font-mono); font-weight: 300; color: var(--text-secondary); }
.tier-tagline { font-size: 11px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5; }
.tier-features { list-style: none; display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
.tier-features li { font-size: 11px; color: var(--text-secondary); display: flex; gap: 8px; line-height: 1.45; }
.tier-features li::before { content: '✓'; color: var(--red); flex-shrink: 0; font-size: 10px; margin-top: 1px; }
.tier-turnaround {
  font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;
  border-top: 0.5px solid var(--border); padding-top: 10px; margin-bottom: 14px;
}
.tier-btn {
  display: block; text-align: center;
  padding: 9px 12px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
  border-radius: var(--radius);
  cursor: pointer; text-decoration: none;
  font-family: var(--font-mono);
  border: 0.5px solid var(--red);
  color: var(--red);
  background: transparent;
  transition: background 0.15s, color 0.15s;
}
.tier-btn:hover { background: var(--red); color: #fff; }
.tier-card.featured .tier-btn { background: var(--red); color: #fff; }
.tier-card.featured .tier-btn:hover { opacity: 0.88; }

.addons-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 0.5px solid var(--border);
  margin-top: 1px;
}
.addon-cell { background: var(--bg-surface); padding: 13px 15px; }
.addon-label { font-size: 11px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; line-height: 1.4; }
.addon-price { font-size: 11px; color: var(--red); font-weight: 500; }

/* STEPS */
.steps-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 0.5px solid var(--border);
}
.step-cell { background: var(--bg-surface); padding: 18px 16px; }
.step-num { font-family: var(--font-serif); font-size: 32px; font-weight: 400; color: var(--border-mid); line-height: 1; margin-bottom: 12px; }
.step-title { font-size: 12px; font-weight: 500; color: var(--text-primary); margin-bottom: 5px; }
.step-body { font-size: 11px; color: var(--text-secondary); line-height: 1.6; }

/* FIT */
.fit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
  border: 0.5px solid var(--border);
}
.fit-col { background: var(--bg-surface); padding: 20px 18px; }
.fit-col-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 14px; }
.fit-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.fit-list li { font-size: 12px; color: var(--text-secondary); display: flex; gap: 10px; line-height: 1.5; }
.fit-yes::before { content: '✓'; color: var(--red); flex-shrink: 0; }
.fit-no::before  { content: '✗'; color: var(--text-muted); flex-shrink: 0; }

/* FAQ */
.faq-list { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 0.5px solid var(--border); }
.faq-item { background: var(--bg-surface); padding: 16px 18px; display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
.faq-q { font-size: 12px; font-weight: 500; color: var(--text-primary); line-height: 1.45; }
.faq-a { font-size: 12px; color: var(--text-secondary); line-height: 1.65; }

/* FINAL CTA */
.final-cta {
  padding: 56px 40px;
  text-align: center;
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
}
.final-cta h2 {
  font-family: var(--font-serif);
  font-size: 32px; font-weight: 700; line-height: 1.22;
  color: var(--text-primary);
  max-width: 500px;
  margin: 0 auto 26px;
}
.final-cta h2 em { font-style: italic; color: var(--red); }
.final-cta-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.fine-print { font-size: 10px; color: var(--text-muted); letter-spacing: 0.04em; }

/* FOOTER */
footer {
  background: var(--bg-page);
  border-top: 0.5px solid var(--border);
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-copy { font-size: 10px; color: var(--text-muted); letter-spacing: 0.04em; }
.footer-links { display: flex; gap: 20px; }
.footer-links a { font-size: 10px; color: var(--text-muted); text-decoration: none; letter-spacing: 0.04em; }
.footer-links a:hover { color: var(--text-secondary); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .rr-nav { padding: 14px 20px; }
  .rr-nav-links { display: none; }
  .hero, section { padding: 44px 20px; }
  .hero h1 { font-size: 30px; }
  .problem-grid, .tiers-grid, .steps-row, .addons-row { grid-template-columns: 1fr; }
  .fit-grid { grid-template-columns: 1fr; }
  .faq-item { grid-template-columns: 1fr; gap: 6px; }
  .cred-layout { grid-template-columns: 1fr; }
  .final-cta { padding: 48px 20px; }
  footer { flex-direction: column; gap: 12px; text-align: center; }
}
</style>
</head>
<body>

<nav class="rr-nav">
  <a href="/" class="rr-logo">RUNTIME<span>RESUME</span></a>
  <ul class="rr-nav-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="/order" class="nav-cta">Get started</a></li>
  </ul>
</nav>

<section class="hero">
  <p class="hero-eyebrow">Specialist Resume Service · Embedded · Firmware · FPGA · Robotics · DSP</p>
  <h1>Your Resume Is Being Screened Out Before a Human <em>Reads It.</em></h1>
  <p class="hero-sub">I'm a specialist technical recruiter. I see what happens to firmware, embedded, and FPGA engineering resumes on the other side of the process — the filters, the fast reads, the silent files. Let me fix yours.</p>
  <div class="cta-row">
    <a href="/order?tier=signal-check" class="btn-primary">Get My Resume Reviewed — From $149</a>
    <a href="#how-it-works" class="btn-ghost">See what's included ↓</a>
  </div>
  <div class="trust-strip">
    <div class="trust-item"><div class="trust-dot"></div>Recruiter-side insight, not career-coach advice</div>
    <div class="trust-item"><div class="trust-dot"></div>Placed 100s of engineers across AU &amp; USA</div>
    <div class="trust-item"><div class="trust-dot"></div>27,000 engineers in my network</div>
    <div class="trust-item"><div class="trust-dot"></div>Embedded · Firmware · FPGA · Robotics · DSP</div>
  </div>
</section>

<section>
  <p class="section-label">The Problem</p>
  <h2>Good Engineers Get Screened Out Every Day. Not Because of Their Skills.</h2>
  <div class="problem-grid">
    <div class="problem-cell">
      <p class="cell-num">01</p>
      <p class="cell-title">ATS rejects you before a recruiter sees your name</p>
      <p class="cell-body">Formatting that looks fine in Word breaks the parse completely. Tables, columns, and text boxes are invisible to most ATS systems.</p>
    </div>
    <div class="problem-cell">
      <p class="cell-num">02</p>
      <p class="cell-title">Your skills are buried under a responsibilities list</p>
      <p class="cell-body">Hiring managers skim for outcomes in 8 seconds. If they can't find what you built and what it achieved, they move on.</p>
    </div>
    <div class="problem-cell">
      <p class="cell-num">03</p>
      <p class="cell-title">You're using the wrong keywords for your sub-niche</p>
      <p class="cell-body">"Embedded C" and "C for embedded systems" score differently. RTOS experience needs to be named. Toolchain specifics matter.</p>
    </div>
  </div>
  <div class="rr-quote">"I review hundreds of engineering resumes a year. The same fixable mistakes appear over and over — and most candidates have no idea they're making them."</div>
</section>

<section id="about">
  <p class="section-label">Why Me</p>
  <h2>You're Getting This From Someone Who Screens Engineers For a Living.</h2>
  <div class="cred-layout">
    <!-- REPLACE with: <img src="/images/lance.jpg" alt="Lance" style="width:72px;height:72px;border-radius:2px;object-fit:cover;border:0.5px solid rgba(245,240,235,0.09);flex-shrink:0;"> -->
    <div class="cred-avatar">L</div>
    <div>
      <p class="cred-name">Lance · Founder, RunTime Recruitment</p>
      <p class="cred-role">Specialist Technical Recruiter · Australia &amp; USA</p>
      <ul class="cred-bullets">
        <li>Founded RunTime Recruitment — specialist agency placing embedded, firmware, FPGA, and hardware engineers</li>
        <li>Placed engineers across medical devices, defence, automotive, industrial automation, and consumer electronics</li>
        <li>27,000 engineers in my LinkedIn network — I know what this community looks like on paper</li>
        <li>I see which resumes clients actually respond to, and which ones get filed without a word</li>
        <li>Built AI tooling specifically for engineering resume analysis — every audit is data-informed and recruiter-reviewed</li>
      </ul>
    </div>
  </div>
</section>

<section id="pricing">
  <p class="section-label">Pricing</p>
  <h2>Choose Your Level of Support.</h2>
  <div class="tiers-grid">
    <div class="tier-card">
      <p class="tier-name">Signal Check</p>
      <p class="tier-price">$149 <span>AUD</span></p>
      <p class="tier-tagline">Expert audit. No rewrite. Honest verdict.</p>
      <ul class="tier-features">
        <li>Written audit report (PDF, ~800 words)</li>
        <li>Scored across 5 dimensions</li>
        <li>3 priority recommendations with examples</li>
        <li>Recruiter-market benchmarking</li>
      </ul>
      <p class="tier-turnaround">48 hr turnaround (business days)</p>
      <a href="/order?tier=signal-check" class="tier-btn">Order Signal Check</a>
    </div>
    <div class="tier-card featured">
      <div class="tier-badge">Most Popular</div>
      <p class="tier-name">Full Rewrite</p>
      <p class="tier-price">$347 <span>AUD</span></p>
      <p class="tier-tagline">Complete rebuild. ATS-optimised. One revision included.</p>
      <ul class="tier-features">
        <li>Everything in Signal Check</li>
        <li>Full rewrite in Word + PDF</li>
        <li>ATS-optimised formatting</li>
        <li>Niche keyword optimisation</li>
        <li>Cover letter template</li>
        <li>One revision round (7 days)</li>
      </ul>
      <p class="tier-turnaround">5 business day turnaround</p>
      <a href="/order?tier=full-rewrite" class="tier-btn">Order Full Rewrite</a>
    </div>
    <div class="tier-card">
      <p class="tier-name">Presence Package</p>
      <p class="tier-price">$597 <span>AUD</span></p>
      <p class="tier-tagline">Full repositioning. Resume + LinkedIn + strategy call.</p>
      <ul class="tier-features">
        <li>Everything in Full Rewrite</li>
        <li>LinkedIn profile overhaul</li>
        <li>30-min strategy call with Lance</li>
        <li>Market &amp; salary benchmarking</li>
        <li>Added to RunTime candidate pool</li>
      </ul>
      <p class="tier-turnaround">3 business day turnaround · priority</p>
      <a href="/order?tier=presence-package" class="tier-btn">Order Presence Package</a>
    </div>
  </div>
  <div class="addons-row">
    <div class="addon-cell"><p class="addon-label">Express 24hr turnaround</p><p class="addon-price">+$99</p></div>
    <div class="addon-cell"><p class="addon-label">Second revision round</p><p class="addon-price">+$79</p></div>
    <div class="addon-cell"><p class="addon-label">US market adaptation</p><p class="addon-price">+$79</p></div>
    <div class="addon-cell"><p class="addon-label">FPGA/DSP keyword audit</p><p class="addon-price">+$49</p></div>
  </div>
</section>

<section id="how-it-works">
  <p class="section-label">Process</p>
  <h2>Four Steps. No Guesswork.</h2>
  <div class="steps-row">
    <div class="step-cell">
      <div class="step-num">01</div>
      <p class="step-title">Order &amp; Pay</p>
      <p class="step-body">Choose your tier. Pay securely via Stripe. Instant confirmation email with next steps.</p>
    </div>
    <div class="step-cell">
      <div class="step-num">02</div>
      <p class="step-title">Upload &amp; Brief</p>
      <p class="step-body">Submit your resume and a short intake form. Takes 5 minutes. Tells me what matters most to you.</p>
    </div>
    <div class="step-cell">
      <div class="step-num">03</div>
      <p class="step-title">Expert Review</p>
      <p class="step-body">I audit, rewrite, and quality-check everything personally. No pure AI output shipped. Every delivery signed off by me.</p>
    </div>
    <div class="step-cell">
      <div class="step-num">04</div>
      <p class="step-title">Receive &amp; Revise</p>
      <p class="step-body">Delivered to your inbox. Revision round included in Tiers 2 &amp; 3. Start applying with confidence.</p>
    </div>
  </div>
</section>

<section>
  <p class="section-label">Fit</p>
  <h2>Is This Right For You?</h2>
  <div class="fit-grid">
    <div class="fit-col">
      <p class="fit-col-label">This service is for you if...</p>
      <ul class="fit-list">
        <li class="fit-yes">You apply for roles and don't hear back</li>
        <li class="fit-yes">You're a strong engineer but your resume doesn't reflect it</li>
        <li class="fit-yes">You're transitioning between embedded sub-domains</li>
        <li class="fit-yes">You're targeting Australian or US roles and unsure what's expected</li>
        <li class="fit-yes">You haven't updated your resume in 3+ years</li>
        <li class="fit-yes">You want recruiter-level feedback, not generic advice</li>
      </ul>
    </div>
    <div class="fit-col">
      <p class="fit-col-label">This is not for you if...</p>
      <ul class="fit-list">
        <li class="fit-no">You work in software, web, or data engineering — not my domain</li>
        <li class="fit-no">You want someone to "pretty it up" without changing the substance</li>
        <li class="fit-no">You need it done in under 24 hours without booking express</li>
      </ul>
    </div>
  </div>
</section>

<section>
  <p class="section-label">Common Questions</p>
  <h2>Straight Answers.</h2>
  <div class="faq-list">
    <div class="faq-item">
      <p class="faq-q">Will you use AI to write my resume?</p>
      <p class="faq-a">AI assists with analysis and initial structuring. Every resume is reviewed, edited, and signed off by me personally before delivery. You're paying for recruiter judgment, not an algorithm.</p>
    </div>
    <div class="faq-item">
      <p class="faq-q">Do you guarantee interviews?</p>
      <p class="faq-a">No. Nobody honest does. I guarantee a professionally written resume that accurately represents your experience and is optimised for how recruiters actually evaluate candidates.</p>
    </div>
    <div class="faq-item">
      <p class="faq-q">What if I'm in the USA, not Australia?</p>
      <p class="faq-a">The service covers both markets. If you're targeting US roles specifically, mention it in your intake form. US market adaptation is also available as an add-on for $79.</p>
    </div>
    <div class="faq-item">
      <p class="faq-q">Can you place me after the service?</p>
      <p class="faq-a">Potentially yes — with your permission you'll be added to RunTime's active candidate pool. This is never a condition of the service. The resume work stands on its own.</p>
    </div>
    <div class="faq-item">
      <p class="faq-q">What if I'm not happy with the result?</p>
      <p class="faq-a">Tiers 2 and 3 include a full revision round. If the delivery doesn't meet the brief, I'll rewrite it until it does. Refunds are not offered once work has been delivered — but I stand behind the quality and will make it right.</p>
    </div>
    <div class="faq-item">
      <p class="faq-q">I work in software, not hardware. Can I use this?</p>
      <p class="faq-a">This service is exclusively for embedded, firmware, FPGA, robotics, DSP, and hardware engineers. Outside that domain you'd be better served elsewhere — my value comes from niche depth, not breadth.</p>
    </div>
  </div>
</section>

<section class="final-cta">
  <h2>Your Next Role Starts With a Resume That Gets You <em>In The Room.</em></h2>
  <div class="final-cta-row">
    <a href="/order?tier=signal-check" class="btn-primary">Signal Check — $149</a>
    <a href="/order?tier=full-rewrite" class="btn-primary">Full Rewrite — $347</a>
    <a href="/order?tier=presence-package" class="btn-ghost">Presence Package — $597</a>
  </div>
  <p class="fine-print">Secure payment via Stripe · All major cards accepted · Invoices available for tax</p>
</section>

<footer>
  <p class="footer-copy">© 2026 RunTime Resume · A RunTime Recruitment service · ABN: [YOUR ABN]</p>
  <div class="footer-links">
    <a href="/terms">Terms</a>
    <a href="/privacy">Privacy</a>
    <a href="/contact">Contact</a>
    <a href="https://runtimerec.com.au">runtimerec.com.au</a>
  </div>
</footer>

</body>
</html>

```
