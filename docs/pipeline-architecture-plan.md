# Pipeline Architecture Plan

## Objective

Move candidate-platform features out of the Next.js app and into a dedicated Python service layer that owns:

- intake-to-candidate persistence
- OpenCATS sync
- Qdrant/JSME sync and job notifications
- server-side candidate auth
- referrals and reward tracking
- campaign and transactional email rendering in Python
- APScheduler-driven automations

The existing Next.js app remains the public site, checkout UI, intake UI, delivery UI, admin UI, and candidate dashboard frontend.

## Why This Split

The new April 2026 pipeline spec assumes a backend service model that the current repo does not have. Today the app stores order and intake state directly in Next.js SQLite and sends emails from JavaScript. That is workable for the initial product, but it is the wrong place to accumulate:

- candidate identity and recruiter-state
- session-based dashboard auth
- long-running scheduler jobs
- OpenCATS and Qdrant integration
- referral lifecycle and Paddle discount generation
- shared email template rendering across automations

The new service boundary prevents the frontend from becoming a second candidate CRM.

## Ownership Boundary

### Next.js frontend

Owns:

- marketing pages
- checkout UI
- intake form UI
- delivery pages and admin pages
- dashboard React routes and components

Does not own:

- candidate source-of-truth persistence
- Paddle webhook source-of-truth processing
- dashboard session lifecycle
- email template rendering
- scheduler execution

### FastAPI pipeline API

Owns:

- candidate and referral schema
- intake validation and writes
- OpenCATS candidate upsert
- Qdrant metadata sync
- Paddle webhook idempotency
- magic-link auth and server-side candidate sessions
- referral code creation and discount management
- SES email rendering and send logging
- internal lifecycle event endpoints used by Next.js

### APScheduler worker

Owns:

- LinkedIn share prompt timing
- role match notification scans
- annual refresh offers
- placed-candidate follow-up prompts

## Proposed Repo Additions

### New paths

- `services/pipeline-api/`
- `services/pipeline-worker/`
- `docs/pipeline-architecture-plan.md`

### Service modules

- `app/api/routes/`
- `app/models/`
- `app/schemas/`
- `app/services/`
- `app/jobs/`
- `app/templates/email/`

## Source Of Truth Changes

### Keep temporarily in frontend

- current checkout session handling
- current admin-only delivery tooling
- current SQLite order history needed for the live app

### Migrate out of frontend

- intake candidate state beyond basic UI buffering
- all new recruiter workflow fields
- delivery-triggered representation flow state
- referrals, redemptions, notification logs
- candidate auth and session records
- campaign and lifecycle email sends

Frontend files that should stop growing as new candidate-platform logic lands:

- [frontend/lib/db.js](/home/lanceharvie/runtime-scripts/runtime-resume/frontend/lib/db.js)
- [frontend/lib/order-store.js](/home/lanceharvie/runtime-scripts/runtime-resume/frontend/lib/order-store.js)
- [frontend/lib/email.js](/home/lanceharvie/runtime-scripts/runtime-resume/frontend/lib/email.js)

## Initial Schema

The FastAPI service should own these tables first:

1. `orders`
2. `candidates`
3. `candidate_profiles`
4. `candidate_sessions`
5. `referrals`
6. `referral_redemptions`
7. `notifications_sent`
8. `email_log`
9. `paddle_events`
10. `role_notifications`

The scaffold under `services/pipeline-api/app/models/domain.py` includes these as the starting point.

## Internal API Contract

### Public-ish service endpoints

- `POST /api/intake/submit`
- `POST /api/paddle/webhooks`
- `POST /api/dashboard/auth/request-link`
- `POST /api/dashboard/auth/verify`
- `GET /api/dashboard/me`

### Internal lifecycle endpoints

- `POST /api/internal/orders/{session_id}/delivery-complete`

Next.js should call internal endpoints after checkout or delivery milestones rather than reproducing pipeline logic in route handlers.

## Email Strategy

All candidate lifecycle and campaign email generation moves to Python.

Requirements:

- Jinja2 templates under `services/pipeline-api/app/templates/email/`
- SES sending from the FastAPI service
- `email_log` row for every outbound email
- text and HTML variants for production templates
- unsubscribe/manage-preferences footer for campaign flows

The frontend JS mailer should eventually be reduced to zero or kept only for short-term compatibility while the migration is in progress.

## Auth Strategy

Candidate auth should use magic link login with server-side sessions.

Flow:

1. Candidate enters email in dashboard login UI.
2. FastAPI creates a short-lived login token record in `candidate_sessions`.
3. Python email service sends the magic link.
4. Verification endpoint exchanges the login token for a session token.
5. Session is stored server-side and exposed to the frontend via an `httpOnly` cookie or trusted proxy flow.

This avoids storing JWTs in the browser and matches the requirement to keep auth server-side.

## Scheduler Strategy

Run APScheduler in an external worker process, not inside Next.js and not inside the FastAPI web process.

Worker rules:

- import shared jobs from `services/pipeline-api/app/jobs/`
- keep job logic in the API package so it is testable
- keep scheduling and process management in `services/pipeline-worker/`

## Delivery Event Strategy

The current delivery email flow in [frontend/app/api/orders/send-delivery/route.js](/home/lanceharvie/runtime-scripts/runtime-resume/frontend/app/api/orders/send-delivery/route.js) should become a producer of internal events, not the place where new post-delivery business rules accumulate.

After successful delivery:

1. Next.js sends `delivery-complete` to FastAPI.
2. FastAPI marks the order lifecycle state.
3. FastAPI creates or confirms the candidate referral record.
4. FastAPI enables the representation prompt state.
5. FastAPI schedules or records the LinkedIn share prompt eligibility.

## PR Plan

### PR 1: Service foundation

Scope:

- scaffold `services/pipeline-api`
- scaffold `services/pipeline-worker`
- add settings, DB base, initial ORM models
- add route skeletons
- add shared email template loader
- add this migration plan doc

Exit criteria:

- FastAPI boots and serves `/health`
- worker starts and registers jobs
- schema ownership is explicit in the repo

### PR 2: Intake migration

Scope:

- implement Pydantic intake schema fully
- frontend intake posts to FastAPI-backed endpoint
- candidate and candidate_profile writes
- OpenCATS upsert
- Qdrant metadata sync

Exit criteria:

- one candidate record per email
- OpenCATS updates are idempotent
- Qdrant payload contains source, job-seek status, and representation flag

### PR 3: Delivery-triggered representation flow

Scope:

- delivery-complete internal event
- representation prompt state
- representation opt-in/out persistence
- Python-rendered welcome email
- dashboard auth shell

Exit criteria:

- representation prompt only appears after delivery
- repeated clicks are idempotent
- candidate can log in with magic link

### PR 4: Referral flow

Scope:

- referral code generation
- Paddle discount creation with idempotency keys
- redemption tracking
- reward email flow

### PR 5: Role match notifications

Scope:

- JSME/Qdrant candidate filter
- notification rate limiting
- interest/pass response tracking

### PR 6: Dashboard completion

Scope:

- profile preferences
- representation toggle
- referral hub
- role notification history
- resume downloads

### PR 7: Annual and placement automations

Scope:

- refresh offer workflow
- placed-candidate referral prompt
- final worker scheduling

## Immediate Next Implementation Work

1. Add Alembic config and the first migration for the new service schema.
2. Add an internal auth mechanism so the frontend can call FastAPI safely.
3. Move the current Paddle webhook handling behind FastAPI ownership.
4. Start migrating intake submission from [frontend/app/api/intake/route.js](/home/lanceharvie/runtime-scripts/runtime-resume/frontend/app/api/intake/route.js) to the new service.

## Current Scaffold Status

As of April 5, 2026:

- the FastAPI scaffold exists under `services/pipeline-api/`
- the APScheduler worker scaffold exists under `services/pipeline-worker/`
- Alembic config and an initial migration have been added
- internal API key enforcement has been added to server-to-server FastAPI endpoints
- the existing Next.js intake route forwards candidate data into FastAPI when `PIPELINE_API_BASE_URL` is configured

Required environment variables for the current scaffold:

- `PIPELINE_DATABASE_URL`
- `PIPELINE_INTERNAL_API_KEY`
- `PIPELINE_AUTO_CREATE_SCHEMA=false`
- `PIPELINE_API_BASE_URL` in the Next.js server environment
- `PIPELINE_API_INTERNAL_KEY` in the Next.js server environment
