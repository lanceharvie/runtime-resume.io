import { NextResponse } from "next/server"
import { canSendEmail, sendInternalPurchaseNotification, sendOrderConfirmationEmail } from "@/lib/email"
import { TIER_NAMES } from "@/lib/order-config"
import { isPipelineApiConfigured, notifyPipelineStripeWebhook } from "@/lib/pipeline-api"
import { verifyStripeSignature } from "@/lib/stripe"
import { logWebhookEvent, markConfirmationEmailSent, markInternalPurchaseNotificationSent, upsertOrder } from "@/lib/order-store"

function parseAddonSlugs(value) {
  if (typeof value !== "string" || !value.trim()) return []
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function extractAmountTotal(checkoutSession) {
  if (typeof checkoutSession?.amount_total === "number" && Number.isFinite(checkoutSession.amount_total)) {
    return checkoutSession.amount_total
  }
  return null
}

function buildOrderPatch(event) {
  const checkoutSession = event?.data?.object || {}
  const metadata = checkoutSession?.metadata || {}
  const eventType = event?.type || ""
  const sessionId = typeof metadata?.session_id === "string"
    ? metadata.session_id
    : checkoutSession?.client_reference_id || checkoutSession?.id || ""
  const isPaid = checkoutSession?.payment_status === "paid" || eventType === "checkout.session.completed"
  const isFailed = eventType === "checkout.session.async_payment_failed" || eventType === "checkout.session.expired"

  return {
    session_id: sessionId,
    tier: typeof metadata?.tier_slug === "string" ? metadata.tier_slug : "",
    tier_name: typeof metadata?.tier_name === "string" ? metadata.tier_name : TIER_NAMES[metadata?.tier_slug] || metadata?.tier_slug || "",
    addons: parseAddonSlugs(metadata?.addon_slugs),
    referral_code: typeof metadata?.referral_code === "string" ? metadata.referral_code : "",
    referral_discount_id: checkoutSession?.total_details?.amount_discount ? "applied" : "",
    checkout_status: checkoutSession?.status || "",
    payment_status: isPaid ? "paid" : isFailed ? "failed" : checkoutSession?.payment_status || "pending",
    customer_email: checkoutSession?.customer_details?.email || checkoutSession?.customer_email || "",
    customer_name: checkoutSession?.customer_details?.name || "",
    amount_total: extractAmountTotal(checkoutSession),
    currency: typeof checkoutSession?.currency === "string" ? checkoutSession.currency.toLowerCase() : "usd",
    stripe_url: checkoutSession?.url || "",
    stripe_customer_id: typeof checkoutSession?.customer === "string" ? checkoutSession.customer : "",
    webhook_event_type: eventType,
    paid_at: isPaid ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString()
  }
}

export async function POST(request) {
  const signature = request.headers.get("stripe-signature")
  const rawBody = await request.text()

  let event
  try {
    event = verifyStripeSignature(rawBody, signature)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook signature" },
      { status: 400 }
    )
  }

  try {
    const checkoutSession = event?.data?.object || {}
    const metadata = checkoutSession?.metadata || {}
    const sessionId = typeof metadata?.session_id === "string"
      ? metadata.session_id
      : checkoutSession?.client_reference_id || checkoutSession?.id || ""
    const eventId = event?.id || `${event?.type || "unknown"}-${sessionId}`
    const receivedAt = new Date().toISOString()

    await logWebhookEvent({
      stripe_event_id: eventId,
      session_id: sessionId,
      event_type: event?.type || "stripe.unknown",
      processing_status: "received",
      payload_json: rawBody,
      received_at: receivedAt
    })

    let pipeline = null
    if (isPipelineApiConfigured()) {
      try {
        pipeline = await notifyPipelineStripeWebhook(event)
      } catch (pipelineError) {
        pipeline = {
          ok: false,
          error: pipelineError instanceof Error ? pipelineError.message : "Pipeline Stripe webhook forwarding failed"
        }
      }
    }

    const order = await upsertOrder(buildOrderPatch(event))
    const isPaid = order?.payment_status === "paid"

    if (order && isPaid && canSendEmail()) {
      if (!order.confirmation_email_sent_at) {
        try {
          await sendOrderConfirmationEmail(order)
          await markConfirmationEmailSent(order.session_id)
        } catch (error) {
          console.error("Failed to send Stripe order confirmation email", {
            sessionId: order.session_id,
            error
          })
        }
      }

      if (!order.internal_purchase_notification_sent_at) {
        try {
          await sendInternalPurchaseNotification(order)
          await markInternalPurchaseNotificationSent(order.session_id)
        } catch (error) {
          console.error("Failed to send Stripe internal purchase notification", {
            sessionId: order.session_id,
            error
          })
        }
      }
    }

    await logWebhookEvent({
      stripe_event_id: eventId,
      session_id: order?.session_id || sessionId,
      event_type: event?.type || "stripe.unknown",
      processing_status: "processed",
      payload_json: rawBody,
      received_at: receivedAt,
      processed_at: new Date().toISOString()
    })

    return NextResponse.json({ received: true, pipeline })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed" },
      { status: 400 }
    )
  }
}
