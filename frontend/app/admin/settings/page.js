import Link from "next/link"
import { requireAdminPageSession } from "@/lib/admin-page"
import RewriteSettingsForm from "@/components/rewrite-settings-form"
import { getRewriteSettings } from "@/lib/rewrite-settings-store"

export default async function AdminSettingsPage() {
  await requireAdminPageSession("/admin/settings")
  const settings = getRewriteSettings()
  const envDefaults = {
    provider: process.env.RUNTIME_RESUME_LLM_PROVIDER || "",
    model: process.env.RUNTIME_RESUME_LLM_MODEL || ""
  }

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Admin settings</div>
          <h1 className="rr-title">Rewrite settings</h1>
          <p className="rr-copy">Manage the default rewrite provider, model, prompt version label, and reviewer-visible presets without editing code.</p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/admin/orders">Orders</Link>
            <Link className="rr-btn-ghost" href="/admin/reviewer-queue">Reviewer queue</Link>
          </div>

          <RewriteSettingsForm initialSettings={settings} envDefaults={envDefaults} />
        </div>
      </section>
    </main>
  )
}
