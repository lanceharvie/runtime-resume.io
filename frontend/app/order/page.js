import OrderForm from "@/components/order-form"

export default async function OrderPage({ searchParams }) {
  const params = await searchParams
  const defaultTier = typeof params?.tier === "string" ? params.tier : "full-rewrite"
  const defaultReferralCode = typeof params?.ref === "string" ? params.ref.toUpperCase() : ""

  return (
    <main className="rr-shell">
      <section className="rr-order-shell">
        <div className="rr-container">
          <div className="rr-eyebrow">Order</div>
          <h1 className="rr-title">Choose the right level of intervention, then move to checkout.</h1>
          <p className="rr-copy mb-8">
            Select the service that matches how much support you need, add any extras, and continue to secure checkout.
          </p>
          <OrderForm defaultTier={defaultTier} defaultReferralCode={defaultReferralCode} />
        </div>
      </section>
    </main>
  )
}
