import DashboardAuthPanel from "@/components/dashboard-auth-panel"

export default function DashboardPage() {
  return (
    <main className="rr-shell">
      <section className="rr-order-shell">
        <div className="rr-container">
          <div className="rr-eyebrow">Dashboard</div>
          <h1 className="rr-title">Manage your RunTime Resume profile</h1>
          <p className="rr-copy mb-8">
            Use your checkout email to sign in, update your preferences, review role matches, and manage your referral link.
          </p>
          <DashboardAuthPanel />
        </div>
      </section>
    </main>
  )
}
