import Link from "next/link"
import { requireAdminPageSession } from "@/lib/admin-page"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import RewriteHistory from "@/components/rewrite-history"
import { getLatestRewriteDraftForSession, listRewriteDraftsForSession } from "@/lib/rewrite-store"
import { getRewriteSettings } from "@/lib/rewrite-settings-store"
import { listRewriteTracesForSession } from "@/lib/rewrite-trace-store"

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

function generatorLabel(value) {
  if (!value) return "—"
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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

export default async function RewritePage({ params, searchParams }) {
  const { sessionId } = await params
  await requireAdminPageSession(`/rewrite/${encodeURIComponent(sessionId)}`)
  const query = await searchParams
  const [order, intake, rewriteDraft, rewriteHistory, rewriteTraces, rewriteSettings] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestRewriteDraftForSession(sessionId),
    listRewriteDraftsForSession(sessionId, 10),
    listRewriteTracesForSession(sessionId, 20),
    getRewriteSettings()
  ])

  if (!order || !rewriteDraft) {
    return (
      <main className="rr-shell">
        <section className="rr-page-hero">
          <div className="rr-container">
            <div className="rr-eyebrow">Rewrite draft</div>
            <h1 className="rr-title">Rewrite draft not available.</h1>
            <p className="rr-copy">Generate a Tier 2 draft first from the reviewer queue.</p>
          </div>
        </section>
      </main>
    )
  }

  const rewrite = rewriteDraft.rewrite || {}
  const traceFilters = {
    status: String(query?.trace_status || "").trim(),
    provider: String(query?.trace_provider || "").trim(),
    model: String(query?.trace_model || "").trim()
  }
  const filteredRewriteTraces = filterRewriteTraces(rewriteTraces, traceFilters)
  const traceBaseHref = `/rewrite/${encodeURIComponent(sessionId)}`
  const traceProviders = uniqueTraceValues(rewriteTraces, "provider")
  const traceModels = uniqueTraceValues(rewriteTraces, "model")

  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Rewrite draft</div>
          <h1 className="rr-title">{order.tier_name || order.tier} rewrite</h1>
          <p className="rr-copy">This page renders the current working Tier 2 rewrite draft for reviewer use and export.</p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href={`/admin/reviewer-queue/${encodeURIComponent(sessionId)}`}>Back to reviewer page</Link>
            <Link className="rr-btn-primary" href={`/api/rewrites/pdf/${encodeURIComponent(sessionId)}`}>Download rewrite PDF</Link>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Rewrite context</div>
            <div className="rr-order-summary-row"><span>Status</span><span>{rewriteDraft.status || "draft"}</span></div>
            <div className="rr-order-summary-row"><span>Email</span><span>{order.customer_email || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Target roles</span><span>{intake?.target_roles || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Updated</span><span>{formatDate(rewriteDraft.updated_at)}</span></div>
            <div className="rr-order-summary-row"><span>Generator</span><span>{generatorLabel(rewriteDraft?.generator_source || rewrite?.meta?.generated_from)}</span></div>
            <div className="rr-order-summary-row"><span>Provider</span><span>{rewriteDraft?.llm_provider || rewrite?.meta?.llm_provider || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Model</span><span>{rewriteDraft?.llm_model || rewrite?.meta?.llm_model || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Prompt version</span><span>{rewriteDraft?.prompt_version || rewrite?.meta?.prompt_version || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Preset</span><span>{presetLabel(rewriteSettings?.presets, rewriteDraft?.preset_id)}</span></div>
            {rewrite?.meta?.llm_error ? <p className="rr-note" style={{ marginTop: "0.65rem", color: "#f0c36a" }}>LLM fallback: {rewrite.meta.llm_error}</p> : null}
          </div>
          <RewriteHistory history={rewriteHistory} presets={rewriteSettings?.presets || []} />
          {rewriteTraces.length ? (
            <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
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

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Summary</div>
            <p className="rr-note">{rewrite.summary || "—"}</p>
          </div>

          <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
            <div className="rr-field-label">Skills section</div>
            <p className="rr-note">{(rewrite.skills_section || []).join(" · ") || "—"}</p>
          </div>

          {(rewrite.experience_sections || []).map((section, index) => (
            <div key={`${section.title || "section"}-${index}`} className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
              <div className="rr-field-label">{section.title || "Experience section"}</div>
              {(section.bullets || []).map((bullet, bulletIndex) => (
                <p key={bulletIndex} className="rr-note">• {bullet}</p>
              ))}
            </div>
          ))}

          {(rewrite.rewrite_notes || []).length ? (
            <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
              <div className="rr-field-label">Rewrite notes</div>
              {(rewrite.rewrite_notes || []).map((note, index) => (
                <p key={index} className="rr-note">• {note}</p>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
