import Link from "next/link"
import { listReviewerQueue } from "@/lib/intake-store"
import { requireAdminPageSession } from "@/lib/admin-page"
import { getRewriteSettings } from "@/lib/rewrite-settings-store"

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

function matchesQuery(item, query) {
  if (!query) return true
  const haystack = [
    item.session_id,
    item.customer_email,
    item.tier,
    item.tier_name,
    item.linkedin_url,
    item.target_roles,
    item.geographic_preference,
    item.resume_filename,
    item.concerns
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query)
}

function matchesFilter(item, filter) {
  if (filter === "delivered") return Boolean(item.delivered_at)
  if (filter === "pending") return !item.delivered_at
  return true
}

function filterHref(filter, query) {
  const params = new URLSearchParams()
  if (filter && filter !== "all") params.set("filter", filter)
  if (query) params.set("q", query)
  const qs = params.toString()
  return qs ? `/admin/reviewer-queue?${qs}` : "/admin/reviewer-queue"
}

export default async function ReviewerQueuePage({ searchParams }) {
  await requireAdminPageSession("/admin/reviewer-queue")
  const params = await searchParams
  const filter = typeof params?.filter === "string" ? params.filter : "pending"
  const q = typeof params?.q === "string" ? params.q.trim().toLowerCase() : ""

  const [items, rewriteSettings] = await Promise.all([
    listReviewerQueue(100),
    getRewriteSettings()
  ])
  const filteredItems = items.filter((item) => matchesFilter(item, filter) && matchesQuery(item, q))
  const namedPresets = (rewriteSettings?.presets || []).filter((preset) => preset.id !== "env" && preset.id !== "custom")

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Reviewer queue</div>
          <h1 className="rr-title">Submitted intakes ready for audit and rewrite work.</h1>
          <p className="rr-copy">
            This is the operational queue for Lance or a reviewer to pick up paid, submitted briefs and move them into the actual review workflow.
          </p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/admin/orders">Orders</Link>
            <Link className="rr-btn-ghost" href="/admin/settings">Rewrite settings</Link>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Active rewrite defaults</div>
            <div className="rr-order-summary-row"><span>Default provider</span><span>{rewriteSettings?.default_provider || process.env.RUNTIME_RESUME_LLM_PROVIDER || "env default"}</span></div>
            <div className="rr-order-summary-row"><span>Default model</span><span>{rewriteSettings?.default_model || process.env.RUNTIME_RESUME_LLM_MODEL || "env default"}</span></div>
            <div className="rr-order-summary-row"><span>Prompt version</span><span>{rewriteSettings?.prompt_version || "runtime default"}</span></div>
            <div className="rr-order-summary-row"><span>Named presets</span><span>{namedPresets.length ? namedPresets.map((preset) => preset.label).join(", ") : "None configured"}</span></div>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Queue filters</div>
            <form method="get" style={{ display: "grid", gap: "0.85rem" }}>
              <input
                className="rr-input"
                type="search"
                name="q"
                placeholder="Search email, session, LinkedIn, role, concerns"
                defaultValue={q}
              />
              <div className="rr-cta-row" style={{ marginBottom: 0 }}>
                <button className="rr-btn-primary" type="submit">Apply search</button>
                <Link className={filter === "pending" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("pending", q)}>Pending delivery</Link>
                <Link className={filter === "delivered" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("delivered", q)}>Delivered</Link>
                <Link className={filter === "all" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("all", q)}>All</Link>
              </div>
            </form>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "2rem" }}>
            <div className="rr-field-label">Queue</div>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {filteredItems.length === 0 ? (
                <p className="rr-note">No submitted intakes are waiting.</p>
              ) : (
                filteredItems.map((item) => (
                  <Link
                    key={item.session_id}
                    href={`/admin/reviewer-queue/${encodeURIComponent(item.session_id)}`}
                    className="rr-card"
                    style={{ padding: "1rem", display: "block" }}
                  >
                    <div className="rr-order-summary-row">
                      <strong>{item.tier_name || item.tier || "Order"}</strong>
                      <span>{formatDate(item.updated_at)}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Email</span>
                      <span>{item.customer_email || "—"}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Paid</span>
                      <span>{formatDate(item.paid_at)}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Delivered</span>
                      <span>{item.delivered_at ? formatDate(item.delivered_at) : "Pending"}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>LinkedIn</span>
                      <span style={{ maxWidth: "26rem", overflow: "hidden", textOverflow: "ellipsis" }}>{item.linkedin_url || "—"}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Target roles</span>
                      <span style={{ maxWidth: "26rem", overflow: "hidden", textOverflow: "ellipsis" }}>{item.target_roles || "—"}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Geo</span>
                      <span>{item.geographic_preference || "—"}</span>
                    </div>
                    <div className="rr-order-summary-row">
                      <span>Resume file</span>
                      <span>{item.resume_filename || "—"}</span>
                    </div>
                    {item.concerns ? (
                      <p className="rr-note" style={{ marginTop: "0.6rem" }}>
                        {item.concerns}
                      </p>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
