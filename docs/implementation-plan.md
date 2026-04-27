# Implementation Plan

## Objective

Launch a sellable MVP for RunTime Resume, then layer in the AI-assisted review workflow behind it.

## Phase 1: Public MVP

Deliver a production-ready public website and checkout flow.

Scope:

- Next.js 15 App Router frontend
- landing page based on `landing-page.html`
- pages:
  - `/`
  - `/how-it-works`
  - `/pricing`
  - `/about`
  - `/order`
  - `/order/success`
  - `/contact`
  - legal pages
- Stripe Checkout integration
- hosted intake handoff via Typeform
- SES confirmation email
- Plausible analytics

Exit criteria:

- a user can land on the site, pick a tier, pay, and receive the correct next-step email

## Phase 2: Intake and Operations

Add operational workflow and delivery tracking.

Scope:

- order persistence
- intake submission tracking
- intake reminder automation
- admin status tracking
- delivery asset storage via S3
- delivery email flow

Exit criteria:

- paid orders can be tracked from payment through delivery

## Phase 3: Tier 1 AI Audit

Add the first-pass analysis system for Signal Check.

Scope:

- PDF/DOCX parsing
- section normalization
- deterministic checks
- Tier 1 audit prompt execution
- structured audit JSON storage
- PDF report generation draft

Exit criteria:

- Lance can upload a resume, review the generated audit, edit it, and export a report

## Phase 4: Tier 2 Rewrite Workflow

Add rewrite generation and reviewer tooling.

Scope:

- rewrite brief generation
- section-by-section rewrite draft
- critic pass
- reviewer interface with approve/edit/reject controls
- export to Word/PDF pipeline

Exit criteria:

- a rewrite can be drafted, reviewed, edited, and delivered

## Phase 5: Tier 3 and Growth

Add LinkedIn outputs and growth infrastructure.

Scope:

- LinkedIn rewrite outputs
- call prep brief generation
- blog system
- lead magnet delivery
- nurture email sequence
- retargeting setup

Exit criteria:

- the commercial funnel and delivery workflow both operate end to end

## Main Risks

- overbuilding AI before checkout works
- allowing AI output to bypass human review
- weak differentiation in copy and UX
- missing operational tooling for delivery and revisions

## Recommended Immediate Next Step

Scaffold the Next.js app and convert the landing page prototype into reusable sections.
