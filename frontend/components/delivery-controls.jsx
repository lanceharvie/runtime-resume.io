"use client"

import { useState } from "react"

export default function DeliveryControls({
  sessionId,
  deliveredAt,
  deliveryChannel = "",
  deliveryNotes = "",
  deliveryEmailSentAt = ""
}) {
  const [channel, setChannel] = useState(deliveryChannel || "manual")
  const [notes, setNotes] = useState(deliveryNotes || "")
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const handleDeliver = async () => {
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/orders/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          delivery_channel: channel,
          delivery_notes: notes
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to mark order delivered")
      }

      window.location.reload()
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : "Unable to mark order delivered")
      setSaving(false)
    }
  }

  const handleSendDelivery = async () => {
    setSending(true)
    setError("")

    try {
      const response = await fetch("/api/orders/send-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          delivery_channel: channel || "email",
          delivery_notes: notes || "Sent delivery email"
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to send delivery email")
      }

      window.location.reload()
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : "Unable to send delivery email")
      setSending(false)
    }
  }

  return (
    <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div className="rr-field-label">Delivery</div>
      {deliveredAt ? (
        <p className="rr-note" style={{ color: "#7ee081" }}>
          Delivered on {new Date(deliveredAt).toLocaleString("en-AU")}
        </p>
      ) : null}
      {deliveryEmailSentAt ? (
        <p className="rr-note" style={{ color: "#7ee081" }}>
          Delivery email sent on {new Date(deliveryEmailSentAt).toLocaleString("en-AU")}
        </p>
      ) : null}
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="delivery_channel">Delivery channel</label>
        <input
          id="delivery_channel"
          className="rr-input"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
        />
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <label className="rr-field-label" htmlFor="delivery_notes">Delivery notes</label>
        <textarea
          id="delivery_notes"
          className="rr-input rr-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <div className="rr-cta-row" style={{ marginTop: "1rem", marginBottom: 0 }}>
        <button className="rr-btn-primary" type="button" onClick={handleDeliver} disabled={saving}>
          {saving ? "Saving..." : deliveredAt ? "Update delivery" : "Mark delivered"}
        </button>
        <button className="rr-btn-ghost" type="button" onClick={handleSendDelivery} disabled={sending}>
          {sending ? "Sending..." : deliveryEmailSentAt ? "Resend delivery email" : "Send delivery email"}
        </button>
        {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
      </div>
    </div>
  )
}
