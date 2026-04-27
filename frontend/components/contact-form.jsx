"use client"

import { useState } from "react"

const initialValues = {
  name: "",
  email: "",
  linkedin_url: "",
  target_role: "",
  geography: "",
  fit_question: ""
}

export default function ContactForm() {
  const [values, setValues] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to send enquiry")
      setSubmitted(true)
      setValues(initialValues)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send enquiry")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rr-card rr-order-panel">
      <div className="rr-field-label">Contact form</div>
      <p className="rr-note">
        Use this if you want Lance to confirm whether your background is in scope before you buy.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
        <div>
          <label className="rr-note" htmlFor="contact-name">Name</label>
          <input id="contact-name" className="rr-input" name="name" value={values.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="rr-note" htmlFor="contact-email">Email</label>
          <input id="contact-email" className="rr-input" type="email" name="email" value={values.email} onChange={handleChange} required />
        </div>
        <div>
          <label className="rr-note" htmlFor="contact-linkedin">LinkedIn URL</label>
          <input id="contact-linkedin" className="rr-input" name="linkedin_url" value={values.linkedin_url} onChange={handleChange} placeholder="https://www.linkedin.com/in/..." />
        </div>
        <div>
          <label className="rr-note" htmlFor="contact-role">Target role</label>
          <input id="contact-role" className="rr-input" name="target_role" value={values.target_role} onChange={handleChange} placeholder="Senior Embedded Engineer" />
        </div>
        <div>
          <label className="rr-note" htmlFor="contact-geo">Geography</label>
          <input id="contact-geo" className="rr-input" name="geography" value={values.geography} onChange={handleChange} placeholder="Australia / USA / both" />
        </div>
        <div>
          <label className="rr-note" htmlFor="contact-question">Fit question</label>
          <textarea id="contact-question" className="rr-input" name="fit_question" value={values.fit_question} onChange={handleChange} rows={6} placeholder="Briefly describe your background and what you want to know before ordering." required />
        </div>
        <div className="rr-cta-row" style={{ marginBottom: 0 }}>
          <button className="rr-btn-primary" type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send enquiry"}</button>
        </div>
        {submitted ? <p className="rr-note" style={{ color: "#7ee081" }}>Your enquiry has been received. Lance can review it from the admin side now.</p> : null}
        {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
      </form>
    </div>
  )
}
