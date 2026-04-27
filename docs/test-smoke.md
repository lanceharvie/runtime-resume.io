# Smoke Test Checklist

Use this for a fast confidence pass after deployment or major changes.

## Service Health

- [ ] `http://127.0.0.1:3011/` loads
- [ ] `http://127.0.0.1:8100/health` returns `{"status":"ok","service":"RunTime Resume Pipeline API"}`
- [ ] `systemctl --user status runtime-resume.service` is active
- [ ] `systemctl --user status runtime-resume-pipeline-api.service` is active
- [ ] `systemctl --user status runtime-resume-pipeline-worker.service` is active

## Public Site

- [ ] `/`
- [ ] `/pricing`
- [ ] `/how-it-works`
- [ ] `/contact`
- [ ] `/order`

## Admin Access

- [ ] `/admin/orders` redirects to `/admin/login` when logged out
- [ ] admin login succeeds
- [ ] `/admin/orders` loads after login
- [ ] `/admin/reviewer-queue` loads after login
- [ ] `/admin/settings` loads after login

## Candidate Access

- [ ] `/dashboard` loads
- [ ] magic-link request succeeds for a valid candidate email
- [ ] magic-link verify succeeds
- [ ] `/api/dashboard/me` works with an active candidate session
- [ ] candidate dashboard shows profile/referral/notification sections

## Core Product Paths

- [ ] intake submission succeeds
- [ ] delivery page loads for a valid signed link
- [ ] representation accept/decline works after delivery
- [ ] referral lookup returns a valid code/discount for an existing referral

## Automations

- [ ] role matcher one-shot runs without error
- [ ] automation one-shot runs without error

## Result

- [ ] Smoke pass complete
- [ ] Any blocker documented
