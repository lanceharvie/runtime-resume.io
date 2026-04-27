"use client"

import { useMemo, useState } from "react"
import { addons, tiers } from "@/components/landing-data"

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value)
}

export default function OrderForm({ defaultTier, defaultReferralCode = "" }) {
  const initialTier = tiers.find((tier) => tier.slug === defaultTier) || tiers[1]
  const [selectedTier, setSelectedTier] = useState(initialTier.slug)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [referralCode, setReferralCode] = useState(defaultReferralCode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const tier = tiers.find((item) => item.slug === selectedTier) || tiers[1]
  const addonTotal = useMemo(
    () => addons.filter((addon) => selectedAddons.includes(addon.slug)).reduce((sum, addon) => sum + addon.price, 0),
    [selectedAddons]
  )
  const total = tier.price + addonTotal

  const toggleAddon = (slug) => {
    setSelectedAddons((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    )
  }

  const handleCheckout = async () => {
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tier: selectedTier,
          addons: selectedAddons,
          referralCode
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.checkoutUrl || !data.sessionId) {
        throw new Error(data.error || "Unable to start checkout")
      }

      setSubmitting(false)
      window.location.assign(data.checkoutUrl)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout")
      setSubmitting(false)
    }
  }

  return (
    <div className="rr-order-grid">
      <div className="rr-card rr-order-panel">
        <div className="rr-order-section">
          <label className="rr-field-label">Choose your tier</label>
          <div className="rr-tier-options">
            {tiers.map((item) => (
              <label key={item.slug} className="rr-card rr-tier-option">
                <input
                  type="radio"
                  name="tier"
                  checked={selectedTier === item.slug}
                  onChange={() => setSelectedTier(item.slug)}
                />
                <div>
                  <strong>
                    {item.name} · {formatMoney(item.price)}
                  </strong>
                  <span>{item.copy}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label">Optional add-ons</label>
          <div className="rr-addon-list">
            {addons.map((addon) => (
              <label key={addon.slug} className="rr-card rr-addon-item">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes(addon.slug)}
                  onChange={() => toggleAddon(addon.slug)}
                />
                <div>
                  <strong>
                    {addon.name} · {formatMoney(addon.price)}
                  </strong>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="referralCode">Referral code</label>
          <input
            id="referralCode"
            className="rr-input"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
            placeholder="RTABC123"
          />
          <p className="rr-note mt-4">Have a RunTime Resume referral code? Apply it before opening checkout.</p>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label">Checkout</label>
          <p className="rr-copy mb-4">
            You will be taken to secure checkout to complete payment and confirm your order.
          </p>
          <button className="rr-btn-primary" type="button" onClick={handleCheckout} disabled={submitting}>
            {submitting ? "Redirecting to checkout..." : "Continue to Checkout"}
          </button>
          {error ? <p className="rr-note mt-4" style={{ color: "#ff9d90" }}>{error}</p> : null}
        </div>
      </div>

      <aside className="rr-card rr-order-panel">
        <div className="rr-field-label">Order summary</div>
        <div className="rr-order-summary-row">
          <span>{tier.name}</span>
          <span>{formatMoney(tier.price)}</span>
        </div>
        {addons
          .filter((addon) => selectedAddons.includes(addon.slug))
          .map((addon) => (
            <div key={addon.slug} className="rr-order-summary-row">
              <span>{addon.name}</span>
              <span>{formatMoney(addon.price)}</span>
            </div>
          ))}
        <div className="rr-order-summary-row rr-order-total">
          <strong>Total</strong>
          <strong>{formatMoney(total)}</strong>
        </div>
        <p className="rr-note mt-4">
          After payment, you will go straight to the confirmation page where you can begin the intake form immediately.
        </p>
      </aside>
    </div>
  )
}
