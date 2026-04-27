# Frontend

This directory will hold the Next.js 15 App Router site for:

- landing page
- pricing and about pages
- order flow
- success page
- blog
- contact and legal pages

Immediate first build:

1. app shell
2. landing page conversion from `landing-page.html`
3. `/order` flow with Stripe Checkout

## Stripe Configuration

Fill these values in `frontend/.env.example` or your real frontend env file:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SIGNAL_CHECK`
- `STRIPE_PRICE_FULL_REWRITE`
- `STRIPE_PRICE_PRESENCE_PACKAGE`
- `STRIPE_PRICE_ADDON_EXPRESS_24H`
- `STRIPE_PRICE_ADDON_SECOND_REVISION`
- `STRIPE_PRICE_ADDON_US_MARKET_ADAPTATION`

Product mapping:

- `signal-check` -> `STRIPE_PRICE_SIGNAL_CHECK`
- `full-rewrite` -> `STRIPE_PRICE_FULL_REWRITE`
- `presence-package` -> `STRIPE_PRICE_PRESENCE_PACKAGE`
- `express-24h` -> `STRIPE_PRICE_ADDON_EXPRESS_24H`
- `second-revision` -> `STRIPE_PRICE_ADDON_SECOND_REVISION`
- `us-market-adaptation` -> `STRIPE_PRICE_ADDON_US_MARKET_ADAPTATION`

Webhook target:

- frontend Stripe webhook: `/api/webhooks/stripe`

Recommended Stripe events:

- `checkout.session.completed`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
