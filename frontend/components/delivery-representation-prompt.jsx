"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function DeliveryRepresentationPrompt({ sessionId, accessToken = "" }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPrompt() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(sessionId)}/representation${accessToken ? `?access=${encodeURIComponent(accessToken)}` : ""}`, {
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Unable to load representation prompt")
        }
        if (!cancelled) {
          setState({ loading: false, data, error: "" })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            data: null,
            error: error instanceof Error ? error.message : "Unable to load representation prompt",
          })
        }
      }
    }

    loadPrompt()
    return () => {
      cancelled = true
    }
  }, [sessionId, accessToken])

  async function handleDecision(decision) {
    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(sessionId)}/representation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, access: accessToken }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to save your preference")
      }
      setState({ loading: false, data, error: "" })
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Unable to save your preference",
      }))
    } finally {
      setSaving(false)
    }
  }

  if (state.loading) {
    return (
      <div className="rr-card rr-order-panel" style={{ maxWidth: "42rem", marginTop: "1.5rem" }}>
        <div className="rr-field-label">Representation</div>
        <p className="rr-note">Checking your representation options…</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="rr-card rr-order-panel" style={{ maxWidth: "42rem", marginTop: "1.5rem" }}>
        <div className="rr-field-label">Representation</div>
        <p className="rr-note" style={{ color: "#b42318" }}>{state.error}</p>
      </div>
    )
  }

  if (!state.data?.eligible) {
    return null
  }

  const promptStatus = state.data.representation_prompt_status || "eligible"
  const accepted = promptStatus === "accepted"
  const declined = promptStatus === "declined"

  return (
    <div className="rr-card rr-order-panel" style={{ maxWidth: "42rem", marginTop: "1.5rem" }}>
      <div className="rr-field-label">RunTime representation</div>
      <p className="rr-copy" style={{ marginTop: "0.5rem" }}>
        If you want, RunTime can keep you in mind for suitable roles and reach out when there is a strong fit.
      </p>

      {accepted ? (
        <>
          <p className="rr-note" style={{ color: "#027a48", marginTop: "0.75rem" }}>
            You’re marked as open to RunTime representation.
          </p>
          <div className="rr-cta-row">
            <Link className="rr-btn-ghost" href="/dashboard">Open dashboard</Link>
          </div>
        </>
      ) : null}

      {declined ? (
        <p className="rr-note" style={{ marginTop: "0.75rem" }}>
          You’ve opted out for now. You can still change this later from your dashboard.
        </p>
      ) : null}

      {!accepted && !declined ? (
        <div className="rr-cta-row">
          <button className="rr-btn-primary" type="button" disabled={saving} onClick={() => handleDecision("accept")}>
            {saving ? "Saving..." : "Yes, keep me in mind"}
          </button>
          <button className="rr-btn-ghost" type="button" disabled={saving} onClick={() => handleDecision("decline")}>
            {saving ? "Saving..." : "No thanks"}
          </button>
        </div>
      ) : null}
    </div>
  )
}
