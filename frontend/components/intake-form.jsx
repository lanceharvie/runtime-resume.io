"use client"

import { useState } from "react"

export default function IntakeForm({ sessionId, order, existingIntake }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(Boolean(existingIntake))
  const [error, setError] = useState("")
  const [values, setValues] = useState({
    linkedin_url: existingIntake?.linkedin_url || "",
    target_roles: existingIntake?.target_roles || "",
    target_companies: existingIntake?.target_companies || "",
    key_achievements: existingIntake?.key_achievements || "",
    years_experience: existingIntake?.years_experience || "",
    geographic_preference: existingIntake?.geographic_preference || "",
    target_locations: existingIntake?.target_locations || "",
    salary_range: existingIntake?.salary_range || "",
    role_types: existingIntake?.role_types || "",
    job_seek_status: existingIntake?.job_seek_status || "open_to_opportunities",
    open_to_representation: existingIntake?.open_to_representation !== "false",
    relocation_flag: existingIntake?.relocation_flag === "true",
    concerns: existingIntake?.concerns || ""
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const formData = new FormData(event.currentTarget)
      formData.set("session_id", sessionId)

      const response = await fetch("/api/intake", {
        method: "POST",
        body: formData
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit intake")
      }

      setSubmitted(true)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit intake")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rr-order-grid">
      <form className="rr-card rr-order-panel" onSubmit={handleSubmit}>
        <input type="hidden" name="session_id" value={sessionId} />

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="resume_file">Resume upload</label>
          <input id="resume_file" name="resume_file" type="file" accept=".pdf,.doc,.docx" />
          <p className="rr-note mt-4">
            Upload your current resume in PDF or Word format so the review can start from your latest version.
          </p>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="linkedin_url">LinkedIn URL</label>
          <input className="rr-input" id="linkedin_url" name="linkedin_url" value={values.linkedin_url} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="target_roles">Target roles / job titles</label>
          <textarea className="rr-input rr-textarea" id="target_roles" name="target_roles" value={values.target_roles} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="target_companies">Target companies or sectors</label>
          <textarea className="rr-input rr-textarea" id="target_companies" name="target_companies" value={values.target_companies} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="key_achievements">Achievements that are underrepresented</label>
          <textarea className="rr-input rr-textarea" id="key_achievements" name="key_achievements" value={values.key_achievements} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="years_experience">Years of experience / seniority</label>
          <input className="rr-input" id="years_experience" name="years_experience" value={values.years_experience} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="geographic_preference">Geographic preference</label>
          <input className="rr-input" id="geographic_preference" name="geographic_preference" value={values.geographic_preference} onChange={handleChange} placeholder="AU / USA / both" />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="target_locations">Target locations</label>
          <input className="rr-input" id="target_locations" name="target_locations" value={values.target_locations} onChange={handleChange} placeholder="Sydney, Melbourne, Remote" />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="salary_range">Target salary range</label>
          <input className="rr-input" id="salary_range" name="salary_range" value={values.salary_range} onChange={handleChange} placeholder="AUD 180k-220k" />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="role_types">Role types / niche tags</label>
          <input className="rr-input" id="role_types" name="role_types" value={values.role_types} onChange={handleChange} placeholder="embedded, firmware, hardware" />
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="job_seek_status">Job seek status</label>
          <select className="rr-input" id="job_seek_status" name="job_seek_status" value={values.job_seek_status} onChange={handleChange}>
            <option value="actively_looking">Actively looking</option>
            <option value="open_to_opportunities">Open to opportunities</option>
            <option value="not_seeking">Not seeking</option>
          </select>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="open_to_representation">Representation preference</label>
          <label className="rr-note" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              id="open_to_representation"
              name="open_to_representation"
              type="checkbox"
              checked={values.open_to_representation}
              onChange={handleChange}
            />
            I’m open to RunTime actively representing me for relevant roles.
          </label>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="relocation_flag">Relocation</label>
          <label className="rr-note" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              id="relocation_flag"
              name="relocation_flag"
              type="checkbox"
              checked={values.relocation_flag}
              onChange={handleChange}
            />
            I’m open to relocation for the right role.
          </label>
        </div>

        <div className="rr-order-section">
          <label className="rr-field-label" htmlFor="concerns">Specific concerns</label>
          <textarea className="rr-input rr-textarea" id="concerns" name="concerns" value={values.concerns} onChange={handleChange} />
        </div>

        <div className="rr-order-section">
          <button className="rr-btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : submitted ? "Update intake" : "Submit intake"}
          </button>
          {error ? <p className="rr-note mt-4" style={{ color: "#ff9d90" }}>{error}</p> : null}
          {submitted ? <p className="rr-note mt-4" style={{ color: "#7ee081" }}>Intake submitted successfully.</p> : null}
        </div>
      </form>

      <aside className="rr-card rr-order-panel">
        <div className="rr-field-label">Order</div>
        <div className="rr-order-summary-row">
          <span>Session</span>
          <span style={{ maxWidth: "15rem", overflow: "hidden", textOverflow: "ellipsis" }}>{sessionId}</span>
        </div>
        <div className="rr-order-summary-row">
          <span>Tier</span>
          <span>{order?.tier_name || order?.tier || "—"}</span>
        </div>
        <div className="rr-order-summary-row">
          <span>Email</span>
          <span>{order?.customer_email || "—"}</span>
        </div>
        <div className="rr-order-summary-row">
          <span>Payment</span>
          <span>{order?.payment_status || "—"}</span>
        </div>
        <div className="rr-order-summary-row">
          <span>Intake status</span>
          <span>{order?.intake_submitted_at ? "Submitted" : "Pending"}</span>
        </div>
        <p className="rr-note mt-4">
          The more specific your answers are, the easier it is to position the resume correctly without extra back-and-forth.
        </p>
      </aside>
    </div>
  )
}
