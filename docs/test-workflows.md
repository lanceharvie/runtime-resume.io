# Workflow Test Guide

## Purpose

This document is the manual test plan for the full RunTime Resume app as it exists in this repo.

It covers:

- public marketing and contact flows
- checkout and order creation
- intake submission
- candidate dashboard workflows
- admin login and admin dashboards
- delivery and post-delivery candidate flows
- referral flows
- role-match notification flows
- scheduled automation flows
- pipeline API and worker verification

Use this as the primary regression checklist before shipping changes.

Companion docs:

- [test-smoke.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/test-smoke.md)
- [test-regression.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/test-regression.md)
- [test-external-integrations.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/test-external-integrations.md)
- [test-qa-sheet.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/test-qa-sheet.md)

## Environments

Current local service layout:

- frontend: `http://127.0.0.1:3011`
- pipeline API: `http://127.0.0.1:8100`
- pipeline worker: user systemd service

Current key docs:

- [pipeline-operations.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/pipeline-operations.md)
- [pipeline-architecture-plan.md](/home/lanceharvie/runtime-scripts/runtime-resume/docs/pipeline-architecture-plan.md)

## Preconditions

Before running the tests:

1. Confirm the services are running.
2. Confirm the frontend was rebuilt after the latest changes.
3. Confirm `services/pipeline-api/.env` and `frontend/.env.local` are populated for the machine.
4. Confirm the pipeline DB migrated successfully.
5. Confirm the app has at least one test candidate and one referral code if you want to test downstream candidate flows without buying a real order.

## Quick Health Checks

Run these first:

1. Frontend root loads:
   `GET http://127.0.0.1:3011/`

2. Pipeline health returns OK:
   `GET http://127.0.0.1:8100/health`

3. User services are active:
   `systemctl --user status runtime-resume.service`
   `systemctl --user status runtime-resume-pipeline-api.service`
   `systemctl --user status runtime-resume-pipeline-worker.service`

4. Dashboard API route exists:
   `GET http://127.0.0.1:3011/api/dashboard/me`
   Expected without a candidate session:
   `401 {"error":"No dashboard session"}`

5. Admin protection is active:
   `GET http://127.0.0.1:3011/admin/orders`
   Expected without admin session:
   redirect to `/admin/login`

## Public Site Workflows

### 1. Marketing pages

Pages to load manually:

- `/`
- `/about`
- `/pricing`
- `/how-it-works`
- `/privacy`
- `/terms`
- `/contact`

Expected:

- no server errors
- no broken navigation
- pricing/order CTA links resolve

### 2. Contact form

Path:

- `/contact`

Steps:

1. Submit a valid inquiry.
2. Submit with one missing required field.

Expected:

- valid submission returns success
- invalid submission shows an error
- the record is stored in frontend SQLite

## Checkout Workflows

### 3. Standard checkout start

Path:

- `/order`

Steps:

1. Select each tier.
2. Add and remove add-ons.
3. Confirm total changes correctly.
4. Start checkout.

Expected:

- `POST /api/checkout` succeeds when Paddle checkout is available
- a local order row is created in frontend SQLite
- session ID is returned

Current known external blocker:

- live transaction creation may fail if the Paddle account is not fully checkout-enabled

### 4. Referral checkout start

Path:

- `/order?ref=<referral_code>`

Steps:

1. Open the order page with a valid referral code.
2. Confirm the referral field pre-fills.
3. Start checkout.

Expected:

- the frontend validates the referral against the pipeline API
- the pipeline returns a live Paddle discount ID for valid codes
- the frontend checkout payload includes the referral metadata

Known result on this machine:

- live referral discount creation is verified
- live checkout transaction creation is blocked by Paddle account onboarding status

## Intake Workflows

### 5. Intake submission

Path:

- `/intake`

Steps:

1. Submit a valid intake for a paid order session.
2. Include target roles, locations, salary, role types, and representation preference.
3. Submit once, then submit again with changed values.

Expected:

- frontend intake route accepts the submission
- pipeline intake endpoint persists the candidate
- OpenCATS candidate is created or updated
- Qdrant payload is created or updated
- repeat submit updates the candidate instead of duplicating

Verify:

- pipeline DB `candidates`
- pipeline DB `candidate_profiles`
- OpenCATS candidate/custom fields
- Qdrant payload

## Candidate Dashboard Workflows

### 6. Dashboard login request

Path:

- `/dashboard`

Steps:

1. Enter the checkout email.
2. Request a magic link.

Expected:

- email send path runs through the Python email service
- preview-mode message appears if SES is not fully configured
- a candidate session row is created with a magic token

### 7. Dashboard login verify

Steps:

1. Open the magic link.
2. Confirm the dashboard establishes a session.

Expected:

- `runtime_resume_candidate_session` cookie is set
- `/api/dashboard/me` returns candidate data
- dashboard loads preferences, referral info, and notifications

### 8. Dashboard profile editing

Steps:

1. Update name, target roles, target locations, salary, role types, geography, relocation, and job-seek status.
2. Save changes.

Expected:

- dashboard preference save succeeds
- candidate row is updated
- OpenCATS sync markers update
- Qdrant sync markers update

### 9. Dashboard representation controls

Steps:

1. If the candidate is delivered and eligible, accept representation.
2. Reload the page.
3. Decline representation.

Expected:

- state changes persist
- candidate `open_to_representation` changes
- representation prompt status changes
- welcome email is sent only once on first accept

### 10. Dashboard notifications

Steps:

1. Open the dashboard for a candidate with at least one role notification.
2. Review notification cards.
3. Click `Interested`.
4. Click `Not interested` on a different notification if available.

Expected:

- notification list loads
- response is saved to `role_notifications`
- OpenCATS is updated with the response marker
- notification card status updates in the UI

### 11. Dashboard referral area

Steps:

1. Open the dashboard referral section.
2. Confirm code, link, usage count, reward info, and latest reward status are shown.

Expected:

- referral record loads from the pipeline API
- reward and redemption metadata are visible

## Delivery Workflows

### 12. Signed delivery page

Path:

- `/delivery/[sessionId]?access=<token>`

Steps:

1. Open a valid signed delivery link.
2. Confirm report/download area renders.
3. Confirm the representation prompt appears when eligible.

Expected:

- delivery access token is enforced
- delivery page loads for valid links
- representation prompt accepts/declines correctly

### 13. Delivery-complete event

Trigger:

- admin delivery action or `/api/orders/send-delivery`

Expected:

- frontend sends `delivery-complete` to the pipeline API
- pipeline order is marked delivered
- representation prompt becomes eligible
- referral record is created if candidate exists
- share prompt state becomes pending

## Admin Workflows

### 14. Admin login gate

Paths:

- `/admin`
- `/admin/orders`
- `/admin/reviewer-queue`
- `/admin/settings`

Steps:

1. Visit each path without login.
2. Confirm redirect to `/admin/login`.
3. Log in with configured admin credentials.
4. Retry each path.

Expected:

- anonymous access redirects to login
- authenticated access works
- admin session cookie is set

### 15. Admin orders dashboard

Path:

- `/admin/orders`

Checks:

- list loads
- order rows render
- delivery/admin actions are available

### 16. Admin reviewer queue

Paths:

- `/admin/reviewer-queue`
- `/admin/reviewer-queue/[sessionId]`

Checks:

- queue loads
- detail page loads
- no unauthorized access without admin login

### 17. Admin settings

Path:

- `/admin/settings`

Checks:

- page loads
- settings read/save behavior works

## Referral Workflows

### 18. Referral creation

Trigger:

- delivery complete for a candidate order

Expected:

- a referral record exists
- referral code is unique
- referral link resolves to `/order?ref=<code>`

### 19. Referral discount provisioning

Trigger:

- `GET /api/internal/referrals/{code}`

Expected:

- valid referral returns `ok=true`
- pipeline creates a real Paddle discount when credentials are configured
- discount ID is returned

Known verified example on this machine:

- referral code `RTDSVK2Z`
- discount ID returned by the pipeline API

### 20. Referral redemption

Steps:

1. Start checkout with a valid referral code.
2. Complete payment when Paddle checkout is enabled.
3. Wait for webhook handling.

Expected:

- `referral_redemptions` row is created once
- referrer reward discount is created once
- referrer reward email is sent once
- duplicate webhook does not create duplicate rewards

Current external blocker:

- live checkout creation is blocked until Paddle enables checkout on the account

## Role Match Workflows

### 21. Role matcher source

Current live source:

- `/home/lanceharvie/runtime-scripts/jobboard-signal/jobboard.db`

Fallback source:

- `services/pipeline-api/data/role-match-feed.json`

Steps:

1. Run the one-shot matcher.
2. Confirm jobs are loaded from the local jobboard DB.

Command:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python run_role_match_once.py
```

Expected:

- matcher scans real local jobs
- notifications are created only for eligible candidates
- repeat runs are idempotent due to rate limiting

### 22. Role notification lifecycle

Expected:

- notification email/log row created
- `notifications_sent` row created
- `role_notifications` row created
- candidate can respond in the dashboard
- OpenCATS response markers update

## Automation Workflows

### 23. Share prompt job

Command:

```bash
cd /home/lanceharvie/runtime-scripts/runtime-resume/services/pipeline-api
/home/lanceharvie/qdrant-env/bin/python run_automation_jobs_once.py
```

Expected:

- delivered orders older than the configured delay and marked `pending` get prompted
- order `share_prompt_status` becomes `sent`
- order `share_prompt_sent_at` is set

### 24. Refresh offer job

Expected:

- delivered orders in the refresh window get one refresh email
- `refresh_email_sent` becomes true
- `refresh_email_sent_at` is set

### 25. Placed follow-up job

Current feed:

- `services/pipeline-api/data/placed-followup-feed.json`

Expected:

- matching placed candidate gets referral follow-up email
- referral code/link are included
- duplicate sends are prevented by email-log template IDs

## Pipeline Data Verification

### 26. Pipeline DB tables

Verify these tables contain expected rows after running the workflows:

- `orders`
- `candidates`
- `candidate_profiles`
- `candidate_sessions`
- `referrals`
- `referral_redemptions`
- `notifications_sent`
- `email_log`
- `paddle_events`
- `role_notifications`

### 27. Frontend SQLite

Verify these local tables still behave correctly while migration is in progress:

- `orders`
- `intake_submissions`
- `webhook_events`

## Current Known Gaps

These are not fully complete even if the local workflows pass:

- live paid Paddle redemption cannot be fully completed until the Paddle account allows checkout
- resume file storage and extraction are not fully migrated into the Python service
- candidate dashboard UX is functional but still not fully polished
- some flows are locally demonstrated with seeded candidate/feed data rather than real customer traffic

## Suggested Test Order

Use this order for a full regression pass:

1. Health checks
2. Public site pages
3. Admin login gate
4. Checkout start
5. Intake submission
6. Delivery flow
7. Candidate dashboard login
8. Candidate preferences and representation
9. Referral lookup
10. Role notifications
11. Automation one-shot jobs
12. Database verification

## Pass/Fail Template

For each workflow, record:

- `Status`: pass / fail / blocked
- `Date`
- `Tester`
- `Environment`
- `Notes`
- `Screenshots or logs`

Blocked reasons should explicitly distinguish:

- code defect
- environment/config issue
- third-party blocker
- expected limitation
