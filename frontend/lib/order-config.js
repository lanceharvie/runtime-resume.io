export const TIER_PRICE_IDS = {
  "signal-check": process.env.STRIPE_PRICE_SIGNAL_CHECK || "",
  "full-rewrite": process.env.STRIPE_PRICE_FULL_REWRITE || "",
  "presence-package": process.env.STRIPE_PRICE_PRESENCE_PACKAGE || ""
}

export const ADDON_PRICE_IDS = {
  "express-24h": process.env.STRIPE_PRICE_ADDON_EXPRESS_24H || "",
  "second-revision": process.env.STRIPE_PRICE_ADDON_SECOND_REVISION || "",
  "us-market-adaptation": process.env.STRIPE_PRICE_ADDON_US_MARKET_ADAPTATION || ""
}

export const TURNAROUND_LABELS = {
  "signal-check": "48-hour turnaround",
  "full-rewrite": "5-business-day turnaround",
  "presence-package": "Priority 3-business-day turnaround"
}

export const TIER_NAMES = {
  "signal-check": "Signal Check",
  "full-rewrite": "Full Rewrite",
  "presence-package": "Presence Package"
}

export function buildLineItems({ tier, addons = [] }) {
  const tierPriceId = TIER_PRICE_IDS[tier]
  if (!tierPriceId) {
    throw new Error(`Missing Stripe price ID for tier: ${tier}`)
  }

  const lineItems = [{ price: tierPriceId, quantity: 1 }]

  for (const addon of addons) {
    const priceId = ADDON_PRICE_IDS[addon]
    if (!priceId) {
      throw new Error(`Missing Stripe price ID for add-on: ${addon}`)
    }
    lineItems.push({ price: priceId, quantity: 1 })
  }

  return lineItems
}
