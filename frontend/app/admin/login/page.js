import AdminLoginForm from "@/components/admin-login-form"

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams
  const nextTarget = typeof params?.next === "string" && params.next ? params.next : "/admin/orders"
  const reason = typeof params?.reason === "string" ? params.reason : ""

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container" style={{ maxWidth: "32rem" }}>
          <div className="rr-eyebrow">Admin login</div>
          <h1 className="rr-title">RunTime Resume admin</h1>
          <p className="rr-copy">Sign in to access orders, reviewer workflows, rewrite settings, and delivery controls.</p>
          <AdminLoginForm nextTarget={nextTarget} reason={reason} />
        </div>
      </section>
    </main>
  )
}
