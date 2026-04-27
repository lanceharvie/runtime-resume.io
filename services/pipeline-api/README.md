# Pipeline API

This service owns the candidate pipeline domain for RunTime Resume:

- candidate intake validation
- OpenCATS and Qdrant sync
- Stripe webhook processing and idempotency
- dashboard auth and candidate sessions
- referral and notification state
- Jinja2 email rendering and SES delivery
- worker job entrypoints shared with APScheduler

The Next.js app should act as the web UI and call this service for candidate-platform features.

## Stripe Configuration

Fill these values in `services/pipeline-api/.env.example` or your real pipeline env file:

- `PIPELINE_STRIPE_SECRET_KEY`
- `PIPELINE_STRIPE_WEBHOOK_SECRET`

The pipeline uses Stripe to:

- create one-time promotion codes for checkout referrals
- create one-time promotion codes for referral rewards
- process forwarded Stripe webhook events from the frontend
