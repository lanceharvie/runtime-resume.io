"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginForm({ nextTarget = "/admin/orders", reason = "" }) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Login failed")
      router.push(nextTarget)
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed")
      setSubmitting(false)
    }
  }

  return (
    <>
      {reason === "timeout" ? <p className="rr-note" style={{ color: "#f0c36a" }}>Your admin session expired after 2 hours of inactivity.</p> : null}
      {reason === "logout" ? <p className="rr-note" style={{ color: "#7ee081" }}>You have been signed out.</p> : null}
      <form onSubmit={handleSubmit} className="rr-card rr-order-panel" style={{ marginTop: "1.5rem", display: "grid", gap: "0.85rem" }}>
        <div>
          <label className="rr-note" htmlFor="admin-user">Username</label>
          <input id="admin-user" className="rr-input" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        </div>
        <div>
          <label className="rr-note" htmlFor="admin-pass">Password</label>
          <input id="admin-pass" className="rr-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </div>
        <div className="rr-cta-row" style={{ marginBottom: 0 }}>
          <button className="rr-btn-primary" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
        </div>
        {error ? <p className="rr-note" style={{ color: "#ff9d90" }}>{error}</p> : null}
      </form>
    </>
  )
}
