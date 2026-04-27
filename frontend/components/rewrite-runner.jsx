"use client"

import { useMemo, useState } from "react"
import { DEFAULT_REWRITE_PRESETS, findMatchingRewritePreset, normalizeRewritePresets } from "@/lib/rewrite-presets"

export default function RewriteRunner({
  sessionId,
  lastProvider = "",
  lastModel = "",
  defaultProvider = "",
  defaultModel = "",
  promptVersion = "",
  presets = DEFAULT_REWRITE_PRESETS,
  canCompareProviders = false
}) {
  const availablePresets = useMemo(() => normalizeRewritePresets(presets), [presets])
  const initialPreset = findMatchingRewritePreset(lastProvider, lastModel, availablePresets)
  const [running, setRunning] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState("")
  const [presetId, setPresetId] = useState(initialPreset.id)
  const [provider, setProvider] = useState(initialPreset.id === "custom" ? lastProvider : "")
  const [model, setModel] = useState(initialPreset.id === "custom" ? lastModel : "")
  const [customPromptVersion, setCustomPromptVersion] = useState(initialPreset.id === "custom" ? promptVersion : "")

  const activePreset = useMemo(
    () => availablePresets.find((preset) => preset.id === presetId) || availablePresets[0],
    [availablePresets, presetId]
  )

  const effectiveProvider = activePreset.provider === null ? provider.trim() : activePreset.provider || defaultProvider
  const effectiveModel = activePreset.model === null ? model.trim() : activePreset.model || defaultModel
  const effectivePromptVersion = activePreset.prompt_version === null ? customPromptVersion.trim() : activePreset.prompt_version || promptVersion
  const showCustomFields = activePreset.id === "custom"
  const hasLastSuccessful = Boolean(lastProvider || lastModel)

  const useLastSuccessful = () => {
    const preset = findMatchingRewritePreset(lastProvider, lastModel, availablePresets)
    setPresetId(preset.id)
    if (preset.id === "custom") {
      setProvider(lastProvider || "")
      setModel(lastModel || "")
      setCustomPromptVersion(promptVersion || "")
    }
    setError("")
  }

  const handleRun = async () => {
    setRunning(true)
    setError("")

    try {
      const response = await fetch("/api/rewrites/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          preset_id: activePreset.id,
          provider: effectiveProvider || undefined,
          model: effectiveModel || undefined,
          prompt_version: effectivePromptVersion || undefined
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to generate rewrite draft")
      window.location.reload()
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to generate rewrite draft")
      setRunning(false)
    }
  }

  const handleCompare = async () => {
    setComparing(true)
    setError("")

    try {
      const response = await fetch("/api/rewrites/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to run rewrite comparison")
      window.location.reload()
    } catch (compareError) {
      setError(compareError instanceof Error ? compareError.message : "Unable to run rewrite comparison")
      setComparing(false)
    }
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div className="rr-order-summary-row" style={{ gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
        <select
          className="rr-input"
          style={{ flex: 1 }}
          value={presetId}
          onChange={(event) => setPresetId(event.target.value)}
        >
          {availablePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.label}</option>
          ))}
        </select>
        <button className="rr-btn-ghost" type="button" onClick={handleRun} disabled={running}>
          {running ? "Generating rewrite..." : "Generate Tier 2 draft"}
        </button>
        {canCompareProviders ? (
          <button className="rr-btn-ghost" type="button" onClick={handleCompare} disabled={running || comparing}>
            {comparing ? "Running compare..." : "Compare OpenAI vs Local"}
          </button>
        ) : null}
      </div>

      {hasLastSuccessful ? (
        <div className="rr-cta-row" style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          <button className="rr-btn-ghost" type="button" onClick={useLastSuccessful} disabled={running}>
            Reuse Last Successful Preset
          </button>
        </div>
      ) : null}

      {showCustomFields ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div className="rr-order-summary-row" style={{ gap: "0.75rem", alignItems: "center" }}>
            <input
              className="rr-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="Provider override"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            />
            <input
              className="rr-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="Model override"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </div>
          <input
            className="rr-input"
            type="text"
            placeholder="Prompt version override"
            value={customPromptVersion}
            onChange={(event) => setCustomPromptVersion(event.target.value)}
          />
        </div>
      ) : (
        <p className="rr-note" style={{ marginTop: "0.5rem" }}>
          Provider: {effectiveProvider || "env default"} · Model: {effectiveModel || "env default"}
        </p>
      )}

      <p className="rr-note" style={{ marginTop: "0.5rem" }}>
        Prompt version: {effectivePromptVersion || "runtime default"}
      </p>

      {hasLastSuccessful ? (
        <p className="rr-note" style={{ marginTop: "0.5rem" }}>
          Last successful: {lastProvider || "env default"} · {lastModel || "env default"}
        </p>
      ) : null}

      {showCustomFields ? (
        <p className="rr-note" style={{ marginTop: "0.5rem" }}>
          Use `Custom` only when you need an explicit provider/model/prompt override.
        </p>
      ) : null}

      {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
    </div>
  )
}
