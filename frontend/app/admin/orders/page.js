import { listRecentDeliveryAccessEvents } from "@/lib/access-log-store"
import { listRecentContactInquiries } from "@/lib/contact-store"
import { listRecentIntakeSubmissions } from "@/lib/intake-store"
import { listRecentOrders, listRecentWebhookEvents } from "@/lib/order-store"
import { getRewriteSettings } from "@/lib/rewrite-settings-store"
import { requireAdminPageSession } from "@/lib/admin-page"
import Link from "next/link"

function formatMoney(amount, currency) {
  if (amount == null) return "—"

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: (currency || "AUD").toUpperCase()
  }).format(amount / 100)
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

function statusTone(status) {
  if (status === "paid" || status === "processed") return "#7ee081"
  if (status === "open" || status === "received") return "#f0c36a"
  if (status === "failed" || status === "expired") return "#ff9d90"
  return "#a8a49e"
}

function matchesQuery(order, query) {
  if (!query) return true
  const haystack = [
    order.session_id,
    order.customer_email,
    order.customer_name,
    order.tier,
    order.tier_name,
    order.delivery_channel,
    order.delivery_notes
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query)
}

function matchesFilter(order, filter) {
  if (filter === "delivered") return Boolean(order.delivered_at)
  if (filter === "pending") return !order.delivered_at
  if (filter === "email-sent") return Boolean(order.delivery_email_sent_at)
  if (filter === "needs-intake") return !order.intake_submitted_at
  return true
}

function filterHref(filter, query) {
  const params = new URLSearchParams()
  if (filter && filter !== "all") params.set("filter", filter)
  if (query) params.set("q", query)
  const qs = params.toString()
  return qs ? `/admin/orders?${qs}` : "/admin/orders"
}

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdminPageSession("/admin/orders")
  const params = await searchParams
  const filter = typeof params?.filter === "string" ? params.filter : "all"
  const q = typeof params?.q === "string" ? params.q.trim().toLowerCase() : ""

  const [orders, events, intakes, accessEvents, contactInquiries, rewriteSettings] = await Promise.all([
    listRecentOrders(100),
    listRecentWebhookEvents(100),
    listRecentIntakeSubmissions(50),
    listRecentDeliveryAccessEvents(50),
    listRecentContactInquiries(25),
    getRewriteSettings()
  ])
  const filteredOrders = orders.filter((order) => matchesFilter(order, filter) && matchesQuery(order, q))
  const namedPresets = (rewriteSettings?.presets || []).filter((preset) => preset.id !== "env" && preset.id !== "custom")

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Admin</div>
          <h1 className="rr-title">Orders and webhook activity</h1>
          <p className="rr-copy">
            This is an operational page for tracking paid sessions, email delivery state, and payment webhook flow.
          </p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/admin/reviewer-queue">
              Open reviewer queue
            </Link>
            <Link className="rr-btn-ghost" href="/admin/settings">
              Rewrite settings
            </Link>
            <Link className="rr-btn-ghost" href="/admin/orders">
              Reset filters
            </Link>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Active rewrite defaults</div>
            <div className="rr-order-summary-row"><span>Default provider</span><span>{rewriteSettings?.default_provider || process.env.RUNTIME_RESUME_LLM_PROVIDER || "env default"}</span></div>
            <div className="rr-order-summary-row"><span>Default model</span><span>{rewriteSettings?.default_model || process.env.RUNTIME_RESUME_LLM_MODEL || "env default"}</span></div>
            <div className="rr-order-summary-row"><span>Prompt version</span><span>{rewriteSettings?.prompt_version || "runtime default"}</span></div>
            <div className="rr-order-summary-row"><span>Named presets</span><span>{namedPresets.length ? namedPresets.map((preset) => preset.label).join(", ") : "None configured"}</span></div>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Order filters</div>
            <form method="get" style={{ display: "grid", gap: "0.85rem" }}>
              <input
                className="rr-input"
                type="search"
                name="q"
                placeholder="Search email, session, tier, channel, notes"
                defaultValue={q}
              />
              <div className="rr-cta-row" style={{ marginBottom: 0 }}>
                <button className="rr-btn-primary" type="submit">Apply search</button>
                <Link className={filter === "all" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("all", q)}>All</Link>
                <Link className={filter === "pending" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("pending", q)}>Pending delivery</Link>
                <Link className={filter === "delivered" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("delivered", q)}>Delivered</Link>
                <Link className={filter === "email-sent" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("email-sent", q)}>Delivery email sent</Link>
                <Link className={filter === "needs-intake" ? "rr-btn-primary" : "rr-btn-ghost"} href={filterHref("needs-intake", q)}>Needs intake</Link>
              </div>
            </form>
          </div>

          <div className="rr-order-grid" style={{ marginTop: "2rem", alignItems: "start" }}>
            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Recent orders</div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {filteredOrders.length === 0 ? (
                  <p className="rr-note">No orders match the current filters.</p>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.session_id} className="rr-card" style={{ padding: "1rem" }}>
                      <div className="rr-order-summary-row">
                        <strong>{order.tier_name || order.tier}</strong>
                        <span style={{ color: statusTone(order.payment_status) }}>{order.payment_status || "—"}</span>
                      </div>
                      <div className="rr-order-summary-row"><span>Session</span><span style={{ maxWidth: "18rem", overflow: "hidden", textOverflow: "ellipsis" }}>{order.session_id}</span></div>
                      <div className="rr-order-summary-row"><span>Email</span><span>{order.customer_email || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Total</span><span>{formatMoney(order.amount_total, order.currency)}</span></div>
                      <div className="rr-order-summary-row"><span>Add-ons</span><span>{order.addons?.length ? order.addons.join(", ") : "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Confirmation email</span><span>{order.confirmation_email_sent_at ? formatDate(order.confirmation_email_sent_at) : "Not sent"}</span></div>
                      <div className="rr-order-summary-row"><span>Intake</span><span>{order.intake_submitted_at ? formatDate(order.intake_submitted_at) : "Pending"}</span></div>
                      <div className="rr-order-summary-row"><span>Reminder</span><span>{order.intake_reminder_sent_at ? formatDate(order.intake_reminder_sent_at) : "Not sent"}</span></div>
                      <div className="rr-order-summary-row"><span>Delivered</span><span>{order.delivered_at ? formatDate(order.delivered_at) : "Pending"}</span></div>
                      <div className="rr-order-summary-row"><span>Channel</span><span>{order.delivery_channel || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Delivery notes</span><span style={{ maxWidth: "18rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.delivery_notes || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Delivery email</span><span>{order.delivery_email_sent_at ? formatDate(order.delivery_email_sent_at) : "Not sent"}</span></div>
                      <div className="rr-order-summary-row"><span>Updated</span><span>{formatDate(order.updated_at)}</span></div>
                      <div className="rr-cta-row" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                        <Link className="rr-btn-ghost" href={`/admin/reviewer-queue/${encodeURIComponent(order.session_id)}`}>
                          Open order
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Recent webhook events</div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {events.length === 0 ? (
                  <p className="rr-note">No webhook events recorded yet.</p>
                ) : (
                  events.map((event) => (
                    <div key={`${event.id}-${event.stripe_event_id}`} className="rr-card" style={{ padding: "1rem" }}>
                      <div className="rr-order-summary-row">
                        <strong>{event.event_type}</strong>
                        <span style={{ color: statusTone(event.processing_status) }}>{event.processing_status}</span>
                      </div>
                      <div className="rr-order-summary-row"><span>Webhook event</span><span style={{ maxWidth: "16rem", overflow: "hidden", textOverflow: "ellipsis" }}>{event.stripe_event_id || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Session</span><span style={{ maxWidth: "16rem", overflow: "hidden", textOverflow: "ellipsis" }}>{event.session_id || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Received</span><span>{formatDate(event.received_at)}</span></div>
                      <div className="rr-order-summary-row"><span>Processed</span><span>{formatDate(event.processed_at)}</span></div>
                      {event.error_message ? (
                        <p className="rr-note" style={{ color: "#ff9d90", marginTop: "0.5rem" }}>
                          {event.error_message}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rr-order-grid" style={{ marginTop: "1.5rem", alignItems: "start" }}>
            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Recent contact enquiries</div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {contactInquiries.length === 0 ? (
                  <p className="rr-note">No contact enquiries recorded yet.</p>
                ) : (
                  contactInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="rr-card" style={{ padding: "1rem" }}>
                      <div className="rr-order-summary-row"><strong>{inquiry.name || "Enquiry"}</strong><span>{formatDate(inquiry.created_at)}</span></div>
                      <div className="rr-order-summary-row"><span>Email</span><span>{inquiry.email || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>LinkedIn</span><span style={{ maxWidth: "18rem", overflow: "hidden", textOverflow: "ellipsis" }}>{inquiry.linkedin_url || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Target role</span><span>{inquiry.target_role || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Geography</span><span>{inquiry.geography || "—"}</span></div>
                      <p className="rr-note" style={{ marginTop: "0.6rem" }}>{inquiry.fit_question}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Recent delivery access</div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {accessEvents.length === 0 ? (
                  <p className="rr-note">No delivery views or downloads recorded yet.</p>
                ) : (
                  accessEvents.map((event) => (
                    <div key={event.id} className="rr-card" style={{ padding: "1rem" }}>
                      <div className="rr-order-summary-row"><strong>{event.event_type.replace(/_/g, " ")}</strong><span>{formatDate(event.created_at)}</span></div>
                      <div className="rr-order-summary-row"><span>Session</span><span style={{ maxWidth: "18rem", overflow: "hidden", textOverflow: "ellipsis" }}>{event.session_id}</span></div>
                      <div className="rr-order-summary-row"><span>Access</span><span>{event.access_mode}</span></div>
                      <div className="rr-order-summary-row"><span>IP</span><span>{event.ip_address || "—"}</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Recent intake submissions</div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {intakes.length === 0 ? (
                  <p className="rr-note">No intake submissions recorded yet.</p>
                ) : (
                  intakes.map((intake) => (
                    <div key={intake.session_id} className="rr-card" style={{ padding: "1rem" }}>
                      <div className="rr-order-summary-row"><strong>{intake.tier_name || "Order intake"}</strong><span>{formatDate(intake.updated_at)}</span></div>
                      <div className="rr-order-summary-row"><span>Email</span><span>{intake.customer_email || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>LinkedIn</span><span style={{ maxWidth: "26rem", overflow: "hidden", textOverflow: "ellipsis" }}>{intake.linkedin_url || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Roles</span><span style={{ maxWidth: "26rem", overflow: "hidden", textOverflow: "ellipsis" }}>{intake.target_roles || "—"}</span></div>
                      <div className="rr-order-summary-row"><span>Resume file</span><span>{intake.resume_filename || "—"}</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
