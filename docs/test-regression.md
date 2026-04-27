# Regression Test Checklist

Use this for a fuller product pass before release.

## Public Pages

- [ ] `/`
- [ ] `/about`
- [ ] `/pricing`
- [ ] `/how-it-works`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/contact`

## Contact Flow

- [ ] valid contact submission succeeds
- [ ] invalid contact submission shows an error
- [ ] contact row is written to frontend SQLite

## Checkout Flow

- [ ] each tier can be selected
- [ ] add-ons update total correctly
- [ ] standard checkout request succeeds when Paddle is available
- [ ] referral code pre-fills from `/order?ref=...`
- [ ] invalid referral code is rejected
- [ ] valid referral code resolves through pipeline lookup

## Intake Flow

- [ ] initial intake submit succeeds
- [ ] repeat intake submit updates the same candidate
- [ ] pipeline candidate row is present
- [ ] pipeline candidate profile row is present
- [ ] OpenCATS sync happened
- [ ] Qdrant sync happened

## Candidate Dashboard

- [ ] request magic link
- [ ] verify magic link
- [ ] session cookie is created
- [ ] profile fields render
- [ ] profile update persists
- [ ] OpenCATS sync timestamps update
- [ ] Qdrant sync timestamps update
- [ ] referral section renders
- [ ] notifications section renders

## Representation Flow

- [ ] eligible candidate sees representation controls on delivery page
- [ ] eligible candidate sees representation controls on dashboard
- [ ] accept persists
- [ ] decline persists
- [ ] welcome email sends only once on first accept

## Referral Flow

- [ ] referral record exists after delivery
- [ ] referral link points to `/order?ref=<code>`
- [ ] referral lookup returns a discount ID
- [ ] referrer reward details render in dashboard

## Role Notification Flow

- [ ] matcher creates a role notification for an eligible candidate
- [ ] notification email/log row is created
- [ ] notification appears on dashboard
- [ ] candidate can mark `Interested`
- [ ] candidate can mark `Not interested`
- [ ] response persists in `role_notifications`
- [ ] OpenCATS response marker updates

## Delivery/Admin Flows

- [ ] delivery-complete event updates pipeline order state
- [ ] admin orders page loads
- [ ] admin reviewer queue loads
- [ ] admin settings page loads
- [ ] protected admin APIs reject anonymous access

## Scheduled Automations

- [ ] share prompt job sends when order is old enough
- [ ] refresh offer job sends in refresh window
- [ ] placed follow-up job sends for feed matches
- [ ] repeat job runs are idempotent

## Data Verification

- [ ] pipeline `orders`
- [ ] pipeline `candidates`
- [ ] pipeline `candidate_profiles`
- [ ] pipeline `candidate_sessions`
- [ ] pipeline `referrals`
- [ ] pipeline `referral_redemptions`
- [ ] pipeline `notifications_sent`
- [ ] pipeline `email_log`
- [ ] pipeline `paddle_events`
- [ ] pipeline `role_notifications`

## Result

- [ ] Regression pass complete
- [ ] Failures documented with exact workflow and evidence
