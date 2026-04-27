import Link from "next/link"
import AuditRunner from "@/components/audit-runner"
import DeliveryControls from "@/components/delivery-controls"
import RewriteEditor from "@/components/rewrite-editor"
import RewriteHistory from "@/components/rewrite-history"
import RewriteRunner from "@/components/rewrite-runner"
import ReviewerControls from "@/components/reviewer-controls"
import { requireAdminPageSession } from "@/lib/admin-page"
import { listDeliveryAccessEventsForSession } from "@/lib/access-log-store"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { getLatestRewriteDraftForSession, listRewriteDraftsForSession } from "@/lib/rewrite-store"
import { getRewriteSettings } from "@/lib/rewrite-settings-store"
import { listRewriteTracesForSession } from "@/lib/rewrite-trace-store"

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

function scoreLabel(value) {
  return `${value}/5`
}

function generatorLabel(value) {
  if (!value) return "—"
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function effectiveScores(auditRun) {
  const baseScores = auditRun?.audit?.scores || {}
  const overrides = auditRun?.reviewer_override || {}
  return Object.fromEntries(Object.entries(baseScores).map(([key, value]) => [key, overrides[key] ?? value]))
}

function filterRewriteTraces(traces, filters) {
  return traces.filter((trace) => {
    if (filters.status && trace.trace_status !== filters.status) return false
    if (filters.provider && trace.provider !== filters.provider) return false
    if (filters.model && trace.model !== filters.model) return false
    return true
  })
}

function uniqueTraceValues(traces, key) {
  return Array.from(new Set(traces.map((trace) => String(trace?.[key] || "").trim()).filter(Boolean)))
}


function presetLabel(presets, presetId) {
  if (!presetId) return "—"
  const match = (presets || []).find((preset) => preset.id === presetId)
  return match?.label || presetId
}

function buildTraceHref(basePath, currentFilters, nextFilters = {}) {
  const merged = { ...currentFilters, ...nextFilters }
  const params = new URLSearchParams()
  if (merged.status) params.set("trace_status", merged.status)
  if (merged.provider) params.set("trace_provider", merged.provider)
  if (merged.model) params.set("trace_model", merged.model)
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

export default async function ReviewerQueueDetailPage({ params, searchParams }) {
  const { sessionId } = await params
  await requireAdminPageSession(`/admin/reviewer-queue/${encodeURIComponent(sessionId)}`)
  const query = await searchParams
  const [order, intake, auditRun, accessEvents, rewriteDraft, rewriteHistory, rewriteTraces, rewriteSettings] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestAuditRunForSession(sessionId),
    listDeliveryAccessEventsForSession(sessionId, 25),
    getLatestRewriteDraftForSession(sessionId),
    listRewriteDraftsForSession(sessionId, 10),
    listRewriteTracesForSession(sessionId, 20),
    getRewriteSettings()
  ])

  if (!order || !intake) {
    return (
      <main className="rr-shell"><section className="rr-page-hero"><div className="rr-container"><div className="rr-eyebrow">Reviewer queue</div><h1 className="rr-title">Review item not found.</h1><p className="rr-copy">The intake or order record could not be loaded for this session.</p></div></section></main>
    )
  }

  const audit = auditRun?.audit
  const scores = auditRun ? effectiveScores(auditRun) : {}
  const rewrite = rewriteDraft?.rewrite
  const lastSuccessfulTrace = rewriteTraces.find((trace) => trace.trace_status === "success")
  const traceFilters = {
    status: String(query?.trace_status || "").trim(),
    provider: String(query?.trace_provider || "").trim(),
    model: String(query?.trace_model || "").trim()
  }
  const filteredRewriteTraces = filterRewriteTraces(rewriteTraces, traceFilters)
  const traceBaseHref = `/admin/reviewer-queue/${encodeURIComponent(sessionId)}`
  const traceProviders = uniqueTraceValues(rewriteTraces, "provider")
  const traceModels = uniqueTraceValues(rewriteTraces, "model")

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Reviewer queue</div>
          <h1 className="rr-title">{order.tier_name || order.tier} review</h1>
          <p className="rr-copy">This page combines the intake brief with the stored first-pass audit so Lance can review the work before delivery.</p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/admin/reviewer-queue">Back to queue</Link>
            <Link className="rr-btn-ghost" href="/admin/settings">Settings</Link>
            {auditRun ? <Link className="rr-btn-primary" href={`/report/${encodeURIComponent(sessionId)}`}>Open report</Link> : null}
            {rewriteDraft ? <Link className="rr-btn-ghost" href={`/rewrite/${encodeURIComponent(sessionId)}`}>Open rewrite</Link> : null}
          </div>

          <div className="rr-order-grid" style={{ marginTop: "2rem", alignItems: "start" }}>
            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Intake brief</div>
              <div className="rr-order-summary-row"><span>Email</span><span>{order.customer_email || "—"}</span></div>
              <div className="rr-order-summary-row"><span>LinkedIn</span><span>{intake.linkedin_url || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Roles</span><span>{intake.target_roles || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Companies</span><span>{intake.target_companies || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Experience</span><span>{intake.years_experience || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Geo</span><span>{intake.geographic_preference || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Resume file</span><span>{intake.resume_filename || "—"}</span></div>
              {intake.key_achievements ? <p className="rr-note" style={{ marginTop: "1rem" }}>{intake.key_achievements}</p> : null}
              {intake.concerns ? <p className="rr-note" style={{ marginTop: "1rem", color: "#f0c36a" }}>{intake.concerns}</p> : null}
            </div>

            <div className="rr-card rr-order-panel">
              <div className="rr-field-label">Tier 1 audit</div>
              <AuditRunner sessionId={sessionId} />
              <RewriteRunner
                sessionId={sessionId}
                lastProvider={lastSuccessfulTrace?.provider || rewriteDraft?.llm_provider || ""}
                lastModel={lastSuccessfulTrace?.model || rewriteDraft?.llm_model || ""}
                defaultProvider={rewriteSettings?.default_provider || ""}
                defaultModel={rewriteSettings?.default_model || ""}
                promptVersion={rewriteSettings?.prompt_version || ""}
                presets={rewriteSettings?.presets || []}
                canCompareProviders
              />
              {auditRun ? (
                <>
                  <div className="rr-order-summary-row"><span>Last run</span><span>{formatDate(auditRun.updated_at)}</span></div>
                  <div className="rr-order-summary-row"><span>Parser</span><span>{audit?.meta?.parser || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Extracted chars</span><span>{audit?.meta?.extracted_characters || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Niche</span><span>{audit?.candidate_profile?.niche || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Seniority</span><span>{audit?.candidate_profile?.seniority || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Weighted total</span><span>{audit?.weighted_total || "—"}</span></div>

                  <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
                    <div className="rr-field-label">Scores</div>
                    {Object.entries(scores).map(([key, value]) => (
                      <div key={key} className="rr-order-summary-row"><span>{key.replace(/_/g, " ")}</span><span>{scoreLabel(value)}</span></div>
                    ))}
                  </div>

                  <ReviewerControls auditRun={auditRun} />
                  <DeliveryControls sessionId={sessionId} deliveredAt={order.delivered_at} deliveryChannel={order.delivery_channel} deliveryNotes={order.delivery_notes} deliveryEmailSentAt={order.delivery_email_sent_at} />

                  {rewrite ? (
                    <>
                      <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
                        <div className="rr-field-label">Tier 2 rewrite draft</div>
                        <div className="rr-order-summary-row"><span>Generated</span><span>{formatDate(rewriteDraft.updated_at)}</span></div>
                        <div className="rr-order-summary-row"><span>Generator</span><span>{generatorLabel(rewriteDraft?.generator_source || rewrite?.meta?.generated_from)}</span></div>
                        <div className="rr-order-summary-row"><span>Provider</span><span>{rewriteDraft?.llm_provider || rewrite?.meta?.llm_provider || "—"}</span></div>
                        <div className="rr-order-summary-row"><span>Model</span><span>{rewriteDraft?.llm_model || rewrite?.meta?.llm_model || "—"}</span></div>
                        <div className="rr-order-summary-row"><span>Prompt version</span><span>{rewriteDraft?.prompt_version || rewrite?.meta?.prompt_version || "—"}</span></div>
                        <div className="rr-order-summary-row"><span>Preset</span><span>{presetLabel(rewriteSettings?.presets, rewriteDraft?.preset_id)}</span></div>
                        {rewrite?.meta?.llm_error ? <p className="rr-note" style={{ marginTop: "0.65rem", color: "#f0c36a" }}>LLM fallback: {rewrite.meta.llm_error}</p> : null}
                        <p className="rr-note" style={{ marginTop: "0.75rem" }}>{rewrite.positioning_summary}</p>
                        <div style={{ marginTop: "0.9rem" }}>
                          <strong>Summary</strong>
                          <p className="rr-note">{rewrite.summary}</p>
                        </div>
                        <div style={{ marginTop: "0.9rem" }}>
                          <strong>Skills section</strong>
                          <p className="rr-note">{(rewrite.skills_section || []).join(" · ") || "—"}</p>
                        </div>
                        {(rewrite.experience_sections || []).map((section, index) => (
                          <div key={`${section.title}-${index}`} style={{ marginTop: "0.9rem" }}>
                            <strong>{section.title}</strong>
                            {(section.bullets || []).map((bullet, bulletIndex) => (
                              <p key={bulletIndex} className="rr-note">• {bullet}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                      <RewriteEditor draft={rewriteDraft} />
                      {rewriteHistory.length ? <RewriteHistory history={rewriteHistory} presets={rewriteSettings?.presets || []} /> : null}
                      {rewriteTraces.length ? (
                        <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
                          <div className="rr-field-label">LLM traces</div>
                          <p className="rr-note">Showing {filteredRewriteTraces.length} of {rewriteTraces.length} traces</p>
                          <div className="rr-cta-row" style={{ marginTop: "0.75rem" }}>
                            <Link className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { status: "" })}>All statuses</Link>
                            <Link className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { status: "success" })}>Success</Link>
                            <Link className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { status: "error" })}>Error</Link>
                          </div>
                          {traceProviders.length ? <div className="rr-cta-row" style={{ marginTop: "0.75rem" }}><Link className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { provider: "" })}>All providers</Link>{traceProviders.map((provider) => (<Link key={provider} className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { provider })}>{generatorLabel(provider)}</Link>))}</div> : null}
                          {traceModels.length ? <div className="rr-cta-row" style={{ marginTop: "0.75rem" }}><Link className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { model: "" })}>All models</Link>{traceModels.map((model) => (<Link key={model} className="rr-btn-ghost" href={buildTraceHref(traceBaseHref, traceFilters, { model })}>{model}</Link>))}</div> : null}
                          {filteredRewriteTraces.map((trace) => (
                            <div key={trace.id} style={{ marginTop: "1rem" }}>
                              <div className="rr-order-summary-row"><span>{generatorLabel(trace.provider || "trace")} · {trace.trace_status}</span><span>{formatDate(trace.created_at)}</span></div>
                              <p className="rr-note">Model: {trace.model || "—"} · Prompt: {trace.prompt_version || "—"} · Preset: {presetLabel(rewriteSettings?.presets, trace.preset_id)}</p>
                              {trace.error_message ? <p className="rr-note" style={{ color: "#f0c36a" }}>{trace.error_message}</p> : null}
                              <details style={{ marginTop: "0.5rem" }}>
                                <summary className="rr-note" style={{ cursor: "pointer" }}>Trace payload</summary>
                                <pre className="rr-note" style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{JSON.stringify({ request: trace.request, response: trace.response }, null, 2)}</pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {accessEvents.length ? <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}><div className="rr-field-label">Delivery access</div>{accessEvents.map((event) => (<div key={event.id} className="rr-order-summary-row"><span>{event.event_type.replace(/_/g, " ")} · {event.access_mode}</span><span>{formatDate(event.created_at)}</span></div>))}</div> : null}
                  {auditRun.reviewer_notes ? <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}><div className="rr-field-label">Reviewer notes</div><p className="rr-note">{auditRun.reviewer_notes}</p></div> : null}

                  <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}><div className="rr-field-label">Top issues</div>{(audit?.top_issues || []).map((issue, index) => (<div key={`${issue.dimension}-${index}`} style={{ marginBottom: "0.9rem" }}><strong>{issue.dimension.replace(/_/g, " ")}</strong><p className="rr-note">{issue.issue}</p><p className="rr-note" style={{ color: "#f0c36a" }}>{issue.evidence}</p></div>))}</div>
                  <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}><div className="rr-field-label">Recommendations</div>{(audit?.recommendations || []).map((item) => (<div key={item.priority} style={{ marginBottom: "0.9rem" }}><strong>{item.action}</strong><p className="rr-note">{item.rationale}</p><p className="rr-note" style={{ color: "#7ee081" }}>{item.example}</p></div>))}</div>
                </>
              ) : <p className="rr-note">No audit has been run for this intake yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
