# QA Execution Sheet

Use this sheet while testing. Duplicate it per run if needed.

## Run Info

- Date: 2026-04-05
- Tester:
- Environment: local machine
- Branch or deploy: current workspace
- Frontend URL: `http://127.0.0.1:3011`
- Pipeline API URL: `http://127.0.0.1:8100`

## Smoke

- [ ] Smoke checklist completed
- Notes:
  - frontend service: `runtime-resume.service`
  - pipeline API service: `runtime-resume-pipeline-api.service`
  - pipeline worker service: `runtime-resume-pipeline-worker.service`

## Regression

- [ ] Regression checklist completed
- Notes:

## External Integrations

- [ ] External integration checklist completed
- Notes:
  - OpenCATS local DB is configured
  - Qdrant local instance is configured
  - role matcher reads from `/home/lanceharvie/runtime-scripts/jobboard-signal/jobboard.db`
  - placed follow-up feed path is configured

## Known Blockers

- [ ] Paddle checkout is enabled for the account
  Current issue:
  live checkout transaction creation returned:
  `Checkout has not yet been enabled for this account, you may need to check with Paddle Support that the Paddle onboarding process has completed.`

- [ ] Live paid referral redemption webhook path has been verified
  Current status:
  referral discount creation is verified live, but paid redemption cannot be completed until Paddle checkout is enabled.

- [ ] Resume file storage/extraction is fully migrated into the Python pipeline service
  Current status:
  candidate/intake/platform flows exist, but full resume-storage migration remains incomplete.

## Failures

| Workflow | Status | Evidence | Notes |
|---|---|---|---|
| Paddle live checkout | Blocked | Paddle error response | Account onboarding/checkouts not enabled |
| Paid referral redemption | Blocked | Depends on checkout | Cannot complete until Paddle enables checkout |
| Resume storage migration | Partial | Current architecture state | Python service not yet full source of truth for file storage |

## Sign-off

- [ ] Ready to release
- [ ] Blocked
- Final notes:
  - Admin dashboards are protected behind `/admin/login`
  - Candidate dashboard copy is customer-facing and live
  - Local pipeline API and worker are deployed under user systemd
