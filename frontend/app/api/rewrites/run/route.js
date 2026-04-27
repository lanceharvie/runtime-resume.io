import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { getLatestAuditRunForSession } from "@/lib/audit-store"
import { getIntakeSubmission } from "@/lib/intake-store"
import { getOrderBySessionId } from "@/lib/order-store"
import { generateBestAvailableTier2RewriteDraft } from "@/lib/rewrite-engine"
import { createRewriteDraft } from "@/lib/rewrite-store"
import { resolveRewriteRuntimeSettings } from "@/lib/rewrite-settings-store"
import { logRewriteTrace } from "@/lib/rewrite-trace-store"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const sessionId = String(body?.session_id || "").trim()
  const presetId = typeof body?.preset_id === "string" ? body.preset_id.trim() : ""
  const provider = typeof body?.provider === "string" ? body.provider.trim() : ""
  const model = typeof body?.model === "string" ? body.model.trim() : ""
  const promptVersion = typeof body?.prompt_version === "string" ? body.prompt_version.trim() : ""

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
    const runtimeSettings = resolveRewriteRuntimeSettings({
      presetId: presetId || undefined,
      provider: provider || undefined,
      model: model || undefined,
      promptVersion: promptVersion || undefined
    })

    const rewriteResult = await generateBestAvailableTier2RewriteDraft({
      order,
      intake,
      auditRun,
      overrides: {
        provider: runtimeSettings.provider || undefined,
        model: runtimeSettings.model || undefined,
        promptVersion: runtimeSettings.promptVersion || undefined
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
      preset_id: runtimeSettings.selectedPreset?.id || presetId || "",
      rewrite
    })

    if (llm_trace) {
      await logRewriteTrace({
        rewrite_draft_id: draft.id,
        session_id: sessionId,
        trace: {
          ...llm_trace,
          preset_id: runtimeSettings.selectedPreset?.id || presetId || ""
        }
      })
    }

    return NextResponse.json({
      ok: true,
      draft,
      generator: rewrite.meta?.generated_from || "unknown",
      provider: rewrite.meta?.llm_provider || "",
      model: rewrite.meta?.llm_model || "",
      prompt_version: rewrite.meta?.prompt_version || runtimeSettings.promptVersion || "",
      preset_id: runtimeSettings.selectedPreset?.id || presetId || ""
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate rewrite draft" }, { status: 500 })
  }
}
