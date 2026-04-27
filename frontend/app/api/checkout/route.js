import { NextResponse } from "next/server"
import { buildLineItems, TIER_NAMES } from "@/lib/order-config"
import { upsertOrder } from "@/lib/order-store"
import { createOrderSessionId, createStripeCheckoutSession } from "@/lib/stripe"
import { getPipelineCheckoutReferral, isPipelineApiConfigured } from "@/lib/pipeline-api"

export async function POST(request) {
  try {
    const body = await request.json()
    const tier = typeof body?.tier === "string" ? body.tier : ""
    const addons = Array.isArray(body?.addons) ? body.addons.filter((item) => typeof item === "string") : []
    const referralCode = typeof body?.referralCode === "string" ? body.referralCode.trim().toUpperCase() : ""

    if (!tier) {
      return NextResponse.json({ error: "tier is required" }, { status: 400 })
    }

    const sessionId = createOrderSessionId()
    const lineItems = buildLineItems({ tier, addons })
    const customData = {
      source: "runtimeresume.io",
      brand: "RunTime Resume",
      operator: "RunTime Recruitment",
      tier_slug: tier,
      tier_name: TIER_NAMES[tier] || tier,
      addon_slugs: addons.join(","),
      customer_path: "direct_checkout",
      session_id: sessionId
    }

    let promotionCodeId = ""
    let normalizedReferralCode = ""
    if (referralCode) {
      if (!isPipelineApiConfigured()) {
        return NextResponse.json({ error: "Referral checkout is not available right now" }, { status: 503 })
      }

      const referral = await getPipelineCheckoutReferral(referralCode)
      if (!referral?.ok || !referral?.promotion_code_id) {
        return NextResponse.json({ error: "Referral code is invalid or no longer active" }, { status: 400 })
      }

      promotionCodeId = referral.promotion_code_id
      normalizedReferralCode = referral.referral_code
      customData.referral_code = normalizedReferralCode
      customData.referral_id = String(referral.referral_id || "")
    }

    const origin = new URL(request.url).origin
    const checkoutSession = await createStripeCheckoutSession({
      lineItems,
      metadata: customData,
      promotionCodeId,
      successUrl: `${origin}/order/success?session_id=${encodeURIComponent(sessionId)}`,
      cancelUrl: `${origin}/order`
    })

    await upsertOrder({
      session_id: sessionId,
      tier,
      tier_name: TIER_NAMES[tier] || tier,
      addons,
      referral_code: normalizedReferralCode,
      referral_discount_id: promotionCodeId,
      checkout_status: checkoutSession.status || "open",
      payment_status: checkoutSession.payment_status === "paid" ? "paid" : "pending",
      stripe_url: checkoutSession.url || "",
      stripe_customer_id: typeof checkoutSession.customer === "string" ? checkoutSession.customer : "",
      webhook_event_type: "checkout.session.created",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      checkoutSessionId: checkoutSession.id,
      sessionId,
      referralCode: normalizedReferralCode
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Stripe checkout session" },
      { status: 500 }
    )
  }
}
