"use client"

import { useMemo, useState } from "react"

function scoreFields(scores) {
  return Object.entries(scores || {}).map(([key, value]) => ({
    key,
    label: key.replace(/_/g, " "),
    value
  }))
}

export default function ReviewerControls({ auditRun }) {
  const [notes, setNotes] = useState(auditRun?.reviewer_notes || "")
  const [overrides, setOverrides] = useState(auditRun?.reviewer_override || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const fields = useMemo(() => scoreFields(auditRun?.audit?.scores), [auditRun])

  const handleOverrideChange = (key, value) => {
    const parsed = Number(value)
    setOverrides((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? Math.max(1, Math.min(5, parsed)) : ""
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const cleanedOverrides = Object.fromEntries(
        Object.entries(overrides).filter(([, value]) => value !== "" && value != null)
      )

      const response = await fetch("/api/audits/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: auditRun.id,
          reviewer_notes: notes,
          reviewer_override: cleanedOverrides
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to save review")
      }

      setSaved(true)
      window.location.reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save review")
      setSaving(false)
    }
  }

  return (
    <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div className="rr-field-label">Reviewer controls</div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {fields.map((field) => (
          <label key={field.key} className="rr-order-summary-row" style={{ alignItems: "center" }}>
            <span>{field.label}</span>
            <input
              className="rr-input"
              style={{ width: "5rem", padding: "0.45rem 0.55rem" }}
              type="number"
              min="1"
              max="5"
              step="1"
              value={overrides[field.key] ?? ""}
              placeholder={String(field.value)}
              onChange={(event) => handleOverrideChange(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="rr-field-label" htmlFor="reviewer_notes">Reviewer notes</label>
        <textarea
          id="reviewer_notes"
          className="rr-input rr-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="rr-cta-row" style={{ marginTop: "1rem", marginBottom: 0 }}>
        <button className="rr-btn-primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save review"}
        </button>
        {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
        {saved ? <p className="rr-note" style={{ color: "#7ee081" }}>Saved.</p> : null}
      </div>
    </div>
  )
}
