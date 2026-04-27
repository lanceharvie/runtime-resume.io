# External Integration Test Guide

Use this for flows that depend on third-party systems or machine-local services.

## OpenCATS

- [ ] intake creates or updates a candidate in OpenCATS
- [ ] custom fields are written correctly
- [ ] dashboard preference edits update OpenCATS
- [ ] role-notification responses update OpenCATS markers

Evidence:

- candidate ID
- changed custom fields
- screenshots or SQL output if needed

## Qdrant

- [ ] intake creates or updates candidate payload
- [ ] dashboard preference edits update payload
- [ ] role-match source data is available to the matcher path

Evidence:

- point ID
- payload fields

## Paddle

- [ ] referral lookup provisions a real discount
- [ ] checkout transaction creation works
- [ ] webhook forwarding reaches the pipeline API
- [ ] paid redemption creates `referral_redemptions`
- [ ] referrer reward discount is created once
- [ ] duplicate webhook does not double-reward

Current known blocker on this machine:

- live checkout is blocked until Paddle enables checkout on the account

## SES / Email

- [ ] magic-link email path works
- [ ] representation welcome email path works
- [ ] referral reward email path works
- [ ] role-match email path works
- [ ] share prompt email path works
- [ ] refresh offer email path works
- [ ] placed follow-up email path works

Note:

- preview mode is acceptable for local verification if SES is not fully configured

## Local Jobboard Source

- [ ] matcher loads jobs from `/home/lanceharvie/runtime-scripts/jobboard-signal/jobboard.db`
- [ ] fallback feed is only used if the SQLite source is unavailable

## User Systemd Services

- [ ] `runtime-resume.service`
- [ ] `runtime-resume-pipeline-api.service`
- [ ] `runtime-resume-pipeline-worker.service`

- [ ] all are enabled
- [ ] all are active
- [ ] service restarts succeed

## Result

- [ ] External integration pass complete
- [ ] Any blocker clearly marked as code, config, or third-party
