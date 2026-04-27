"use client"

import { useState } from "react"

function normalizeBullets(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function RewriteEditor({ draft }) {
  const [summary, setSummary] = useState(draft?.rewrite?.summary || "")
  const [skills, setSkills] = useState((draft?.rewrite?.skills_section || []).join("\n"))
  const [notes, setNotes] = useState((draft?.rewrite?.rewrite_notes || []).join("\n"))
  const [status, setStatus] = useState(draft?.status || "draft")
  const [sections, setSections] = useState(draft?.rewrite?.experience_sections || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const updateSection = (index, field, value) => {
    setSections((current) => current.map((section, sectionIndex) => {
      if (sectionIndex !== index) return section
      if (field === "title") return { ...section, title: value }
      return { ...section, bullets: normalizeBullets(value) }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/rewrites/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          status,
          rewrite: {
            ...draft.rewrite,
            summary,
            skills_section: normalizeBullets(skills),
            rewrite_notes: normalizeBullets(notes),
            experience_sections: sections
          }
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to save rewrite draft")
      window.location.reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save rewrite draft")
      setSaving(false)
    }
  }

  return (
    <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div className="rr-field-label">Edit rewrite draft</div>
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="rewrite_status">Status</label>
        <select id="rewrite_status" className="rr-input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="final">Final</option>
        </select>
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="rewrite_summary">Summary</label>
        <textarea id="rewrite_summary" className="rr-input rr-textarea" value={summary} onChange={(event) => setSummary(event.target.value)} />
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="rewrite_skills">Skills section</label>
        <textarea id="rewrite_skills" className="rr-input rr-textarea" value={skills} onChange={(event) => setSkills(event.target.value)} />
      </div>
      {sections.map((section, index) => (
        <div key={`${section.title || "section"}-${index}`} style={{ marginTop: "0.75rem" }}>
          <label className="rr-field-label" htmlFor={`rewrite_title_${index}`}>Section title</label>
          <input id={`rewrite_title_${index}`} className="rr-input" value={section.title || ""} onChange={(event) => updateSection(index, "title", event.target.value)} />
          <label className="rr-field-label" htmlFor={`rewrite_bullets_${index}`} style={{ marginTop: "0.5rem", display: "block" }}>Bullets</label>
          <textarea
            id={`rewrite_bullets_${index}`}
            className="rr-input rr-textarea"
            value={(section.bullets || []).join("\n")}
            onChange={(event) => updateSection(index, "bullets", event.target.value)}
          />
        </div>
      ))}
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="rewrite_notes">Rewrite notes</label>
        <textarea id="rewrite_notes" className="rr-input rr-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="rr-cta-row" style={{ marginTop: "1rem", marginBottom: 0 }}>
        <button className="rr-btn-primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save rewrite draft"}
        </button>
        {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
      </div>
    </div>
  )
}
