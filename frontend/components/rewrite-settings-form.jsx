"use client"

import { useMemo, useState } from "react"
import { REWRITE_PROMPT_VERSION } from "@/lib/rewrite-constants"

function createPresetDraft(index) {
  return {
    id: `preset_${index + 1}`,
    label: "",
    provider: "",
    model: "",
    prompt_version: REWRITE_PROMPT_VERSION
  }
}

export default function RewriteSettingsForm({ initialSettings, envDefaults }) {
  const [defaultProvider, setDefaultProvider] = useState(initialSettings?.default_provider || "")
  const [defaultModel, setDefaultModel] = useState(initialSettings?.default_model || "")
  const [promptVersion, setPromptVersion] = useState(initialSettings?.prompt_version || "")
  const [presets, setPresets] = useState(() => (initialSettings?.presets || []).filter((preset) => preset.id !== "env" && preset.id !== "custom"))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const effectiveProvider = defaultProvider || envDefaults?.provider || "env default"
  const effectiveModel = defaultModel || envDefaults?.model || "env default"

  const sortedPresets = useMemo(() => presets.map((preset, index) => ({ ...preset, order: index })), [presets])

  const updatePreset = (index, key, value) => {
    setPresets((current) => current.map((preset, presetIndex) => (
      presetIndex === index ? { ...preset, [key]: value } : preset
    )))
  }

  const addPreset = () => {
    setPresets((current) => [...current, createPresetDraft(current.length)])
    setMessage("")
    setError("")
  }

  const removePreset = (index) => {
    setPresets((current) => current.filter((_, presetIndex) => presetIndex !== index))
    setMessage("")
    setError("")
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/admin/rewrite-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_provider: defaultProvider,
          default_model: defaultModel,
          prompt_version: promptVersion,
          presets: [
            { id: "env", label: "Env Default", provider: "", model: "", prompt_version: "" },
            ...sortedPresets,
            { id: "custom", label: "Custom", provider: null, model: null, prompt_version: null }
          ]
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to save rewrite settings")
      setMessage("Rewrite settings saved")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save rewrite settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rr-card rr-order-panel" style={{ marginTop: "1.5rem" }}>
      <div className="rr-field-label">Rewrite defaults</div>
      <div className="rr-order-summary-row"><span>Current effective provider</span><span>{effectiveProvider}</span></div>
      <div className="rr-order-summary-row"><span>Current effective model</span><span>{effectiveModel}</span></div>
      <div className="rr-order-summary-row"><span>Env fallback</span><span>{envDefaults?.provider || "—"} · {envDefaults?.model || "—"}</span></div>

      <div style={{ marginTop: "1rem" }}>
        <label className="rr-field-label" htmlFor="default-provider">Default provider</label>
        <input id="default-provider" className="rr-input" type="text" value={defaultProvider} onChange={(event) => setDefaultProvider(event.target.value)} placeholder="openai_responses" />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="rr-field-label" htmlFor="default-model">Default model</label>
        <input id="default-model" className="rr-input" type="text" value={defaultModel} onChange={(event) => setDefaultModel(event.target.value)} placeholder="gpt-5-mini" />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="rr-field-label" htmlFor="prompt-version">Global prompt version label</label>
        <input id="prompt-version" className="rr-input" type="text" value={promptVersion} onChange={(event) => setPromptVersion(event.target.value)} placeholder="runtime_resume_tier2_v1" />
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div className="rr-field-label">Named presets</div>
        <p className="rr-note">`Env Default` and `Custom` are reserved. Named presets can now carry their own provider, model, and prompt version.</p>
        {sortedPresets.map((preset, index) => (
          <div key={preset.id || index} className="rr-card" style={{ padding: "1rem", marginTop: "0.75rem" }}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <input className="rr-input" type="text" value={preset.label || ""} onChange={(event) => updatePreset(index, "label", event.target.value)} placeholder="Preset label" />
              <input className="rr-input" type="text" value={preset.provider || ""} onChange={(event) => updatePreset(index, "provider", event.target.value)} placeholder="Provider" />
              <input className="rr-input" type="text" value={preset.model || ""} onChange={(event) => updatePreset(index, "model", event.target.value)} placeholder="Model" />
              <input className="rr-input" type="text" value={preset.prompt_version || ""} onChange={(event) => updatePreset(index, "prompt_version", event.target.value)} placeholder="Prompt version" />
              <button className="rr-btn-ghost" type="button" onClick={() => removePreset(index)}>Remove preset</button>
            </div>
          </div>
        ))}
        <div className="rr-cta-row" style={{ marginTop: "0.75rem" }}>
          <button className="rr-btn-ghost" type="button" onClick={addPreset}>Add preset</button>
          <button className="rr-btn-primary" type="button" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
        </div>
      </div>

      {message ? <p className="rr-note" style={{ color: "#7ee081", marginTop: "0.75rem" }}>{message}</p> : null}
      {error ? <p className="rr-note" style={{ color: "#ff9d90", marginTop: "0.75rem" }}>{error}</p> : null}
    </div>
  )
}
