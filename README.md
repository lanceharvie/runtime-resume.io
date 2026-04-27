# RunTime Resume

RunTime Resume is a premium resume review and rewriting service for embedded systems, firmware, FPGA, DSP, robotics, and hardware engineers.

This repository will hold:

- the public conversion site
- the order and intake flow
- the AI-assisted review pipeline
- the human review workflow
- delivery and reporting assets

## Initial Structure

- `docs/`
  - implementation notes, milestones, and architecture
- `prompts/`
  - LLM prompt templates for audit, rewrite, and critique
- `knowledge/`
  - rubric, niche keyword libraries, and recruiter heuristics
- `backend/`
  - parsing, analysis, LLM orchestration, reports, and storage
- `frontend/`
  - Next.js app shell and UI components

## Build Order

1. Public site and order flow
2. Intake + email + Stripe webhook handling
3. Resume parsing and deterministic checks
4. Tier 1 audit pipeline
5. Tier 2 rewrite and critique pipeline
6. Human review UI
7. Export and delivery pipeline

## Source of Truth

- Product and business spec: `runtime-resume-spec.md`
- Landing page reference: `landing-page.html`
