import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { generateBestAvailableTier2RewriteDraft } from "@/lib/rewrite-engine"
import { createRewriteDraft } from "@/lib/rewrite-store"
import { logRewriteTrace } from "@/lib/rewrite-trace-store"

const COMPARISON_PRESETS = [
  {
    id: "gpt5mini",
    provider: "openai_responses",
    model: "gpt-5-mini",
    promptVersion: "runtime_resume_tier2_v1"
  },
  {
    id: "localqwen",
    provider: "local_openai",
    model: "qwen",
    promptVersion: "runtime_resume_tier2_v1"
  }
]

async function generateAndStoreDraft({ sessionId, order, intake, auditRun, config }) {
  const rewriteResult = await generateBestAvailableTier2RewriteDraft({
    order,
    intake,
    auditRun,
    overrides: {
      provider: config.provider,
      model: config.model,
      promptVersion: config.promptVersion
    }
  })

  const { llm_trace = null, ...rewrite } = rewriteResult
  const draft = await createRewriteDraft({
    session_id: sessionId,
    status: "draft",
    source_audit_id: auditRun.id,
    source_filename: rewrite.meta?.source_filename || "",
    source_path: rewrite.meta?.source_path || "",
    generator_source: rewrite.meta?.generator_source || rewrite.meta?.generated_from || "",
    llm_provider: rewrite.meta?.llm_provider || "",
    llm_model: rewrite.meta?.llm_model || "",
    prompt_version: rewrite.meta?.prompt_version || "",
    preset_id: config.id,
    rewrite
  })

  if (llm_trace) {
    await logRewriteTrace({
      rewrite_draft_id: draft.id,
      session_id: sessionId,
      trace: {
        ...llm_trace,
        preset_id: config.id
      }
    })
  }

  return {
    id: draft.id,
    provider: rewrite.meta?.llm_provider || "",
    model: rewrite.meta?.llm_model || "",
    prompt_version: rewrite.meta?.prompt_version || ""
  }
}

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }

  const body = await request.json().catch(() => ({}))
  const sessionId = String(body?.session_id || "").trim()
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const [order, intake, auditRun] = await Promise.all([
    getOrderBySessionId(sessionId),
    getIntakeSubmission(sessionId),
    getLatestAuditRunForSession(sessionId)
  ])

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (!intake) return NextResponse.json({ error: "Intake not found" }, { status: 404 })
  if (!auditRun) return NextResponse.json({ error: "Run Tier 1 audit before generating a rewrite draft" }, { status: 400 })

  try {
    const results = []
    for (const config of COMPARISON_PRESETS) {
      results.push(await generateAndStoreDraft({ sessionId, order, intake, auditRun, config }))
    }

    return NextResponse.json({ ok: true, drafts: results })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run rewrite comparison" }, { status: 500 })
  }
}
