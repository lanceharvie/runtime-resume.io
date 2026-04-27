"use client"

import { useState } from "react"

export default function AuditRunner({ sessionId }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")

  const handleRun = async () => {
    setRunning(true)
    setError("")

    try {
      const response = await fetch("/api/audits/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ session_id: sessionId })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to run audit")
      }

      window.location.reload()
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run audit")
      setRunning(false)
    }
  }

  return (
    <div className="rr-cta-row" style={{ marginBottom: "1rem" }}>
      <button className="rr-btn-primary" type="button" onClick={handleRun} disabled={running}>
        {running ? "Running audit..." : "Run Tier 1 audit"}
      </button>
      {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
    </div>
  )
}
