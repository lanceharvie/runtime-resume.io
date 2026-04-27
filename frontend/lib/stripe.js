import { randomUUID } from "node:crypto"
import Stripe from "stripe"

let stripeClient

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return secretKey
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
  }
  return webhookSecret
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey())
  }
  return stripeClient
}

export function createOrderSessionId() {
  return `rr_${randomUUID()}`
}

export async function createStripeCheckoutSession({
  lineItems,
  metadata,
  successUrl,
  cancelUrl,
  promotionCodeId
}) {
  const stripe = getStripeClient()

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: metadata.session_id,
    customer_creation: "always",
    billing_address_collection: "auto",
    metadata,
    payment_intent_data: {
      metadata
    },
    ...(promotionCodeId
      ? {
          discounts: [{ promotion_code: promotionCodeId }],
          allow_promotion_codes: false
        }
      : {
          allow_promotion_codes: true
        })
  })
}

export function verifyStripeSignature(rawBody, signatureHeader) {
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header")
  }

  return getStripeClient().webhooks.constructEvent(rawBody, signatureHeader, getStripeWebhookSecret())
}
