"use client"

import { useEffect, useState } from "react"

export default function DashboardAuthPanel() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [session, setSession] = useState(null)
  const [referral, setReferral] = useState(null)
  const [representation, setRepresentation] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [formValues, setFormValues] = useState({
    full_name: "",
    job_seek_status: "open_to_opportunities",
    open_to_representation: true,
    target_roles: "",
    target_locations: "",
    salary_range: "",
    role_types: "",
    geographic_preference: "",
    relocation_flag: false
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    const tokenFromUrl = url.searchParams.get("token") || ""
    if (!tokenFromUrl) {
      void loadSession()
      return
    }

    setToken(tokenFromUrl)
    void verifyToken(tokenFromUrl)
  }, [])

  async function loadSession() {
    const response = await fetch("/api/dashboard/me", { cache: "no-store" })
    if (!response.ok) {
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.ok) {
      setSession(data)
      setFormValues({
        full_name: data.full_name || "",
        job_seek_status: data.job_seek_status || "open_to_opportunities",
        open_to_representation: Boolean(data.open_to_representation),
        target_roles: data.target_roles || "",
        target_locations: data.target_locations || "",
        salary_range: data.salary_range || "",
        role_types: data.role_types || "",
        geographic_preference: data.geographic_preference || "",
        relocation_flag: Boolean(data.relocation_flag)
      })
      await loadRepresentation()
      await loadNotifications()
      await loadReferral()
    }
  }

  async function loadRepresentation() {
    const response = await fetch("/api/dashboard/representation", { cache: "no-store" })
    if (!response.ok) {
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.ok) {
      setRepresentation(data)
    }
  }

  async function loadReferral() {
    const response = await fetch("/api/dashboard/referral", { cache: "no-store" })
    if (!response.ok) {
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.ok) {
      setReferral(data)
    }
  }

  async function loadNotifications() {
    const response = await fetch("/api/dashboard/notifications", { cache: "no-store" })
    if (!response.ok) {
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.ok) {
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
    }
  }

  async function requestLink(event) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to request magic link")
      }

      setMessage(
        data.delivery_mode === "preview" && data.magic_link_preview
          ? `Magic link generated for ${data.email}. Preview: ${data.magic_link_preview}`
          : `Magic link email sent to ${data.email}.`
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request magic link")
    } finally {
      setLoading(false)
    }
  }

  async function verifyToken(tokenValue) {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenValue })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to verify magic link")
      }

      setMessage(`Dashboard session established for ${data.email}.`)
      await loadSession()
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify magic link")
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/logout", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to end dashboard session")
      }

      setSession(null)
      setReferral(null)
      setRepresentation(null)
      setNotifications([])
      setToken("")
      setMessage("Dashboard session cleared.")
      const url = new URL(window.location.href)
      url.searchParams.delete("token")
      window.history.replaceState({}, "", url.toString())
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to end dashboard session")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setFormValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  async function savePreferences(event) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to update dashboard preferences")
      }

      setSession(data)
      setFormValues({
        full_name: data.full_name || "",
        job_seek_status: data.job_seek_status || "open_to_opportunities",
        open_to_representation: Boolean(data.open_to_representation),
        target_roles: data.target_roles || "",
        target_locations: data.target_locations || "",
        salary_range: data.salary_range || "",
        role_types: data.role_types || "",
        geographic_preference: data.geographic_preference || "",
        relocation_flag: Boolean(data.relocation_flag)
      })
      await loadRepresentation()
      await loadNotifications()
      setMessage("Dashboard preferences updated.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update dashboard preferences")
    } finally {
      setLoading(false)
    }
  }

  async function submitRepresentationDecision(decision) {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/representation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to update representation preference")
      }

      setRepresentation(data)
      await loadSession()
      setMessage(
        data.representation_prompt_status === "accepted"
          ? "You’re marked as open to RunTime representation."
          : "You’ve opted out of RunTime representation for now."
      )
    } catch (representationError) {
      setError(representationError instanceof Error ? representationError.message : "Unable to update representation preference")
    } finally {
      setLoading(false)
    }
  }

  async function submitNotificationResponse(notificationId, responseStatus) {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/dashboard/notifications/${encodeURIComponent(notificationId)}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_status: responseStatus })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Unable to respond to notification")
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setMessage(responseStatus === "interested" ? "Interest recorded." : "You will not be nudged about this role again.")
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Unable to respond to notification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rr-order-grid">
      <div className="rr-card rr-order-panel">
        <div className="rr-field-label">{session ? "Profile settings" : "Sign in"}</div>
        {session ? (
          <form onSubmit={savePreferences}>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="full_name">Name</label>
              <input className="rr-input" id="full_name" name="full_name" value={formValues.full_name} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="job_seek_status">Job seek status</label>
              <select className="rr-input" id="job_seek_status" name="job_seek_status" value={formValues.job_seek_status} onChange={handleChange}>
                <option value="actively_looking">Actively looking</option>
                <option value="open_to_opportunities">Open to opportunities</option>
                <option value="not_seeking">Not seeking</option>
              </select>
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="target_roles">Target roles</label>
              <textarea className="rr-input rr-textarea" id="target_roles" name="target_roles" value={formValues.target_roles} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="target_locations">Target locations</label>
              <input className="rr-input" id="target_locations" name="target_locations" value={formValues.target_locations} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="salary_range">Salary range</label>
              <input className="rr-input" id="salary_range" name="salary_range" value={formValues.salary_range} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="role_types">Role types</label>
              <input className="rr-input" id="role_types" name="role_types" value={formValues.role_types} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-field-label" htmlFor="geographic_preference">Geographic preference</label>
              <input className="rr-input" id="geographic_preference" name="geographic_preference" value={formValues.geographic_preference} onChange={handleChange} />
            </div>
            <div className="rr-order-section">
              <label className="rr-note" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  id="open_to_representation"
                  name="open_to_representation"
                  type="checkbox"
                  checked={formValues.open_to_representation}
                  onChange={handleChange}
                />
                Open to RunTime representation
              </label>
            </div>
            <div className="rr-order-section">
              <label className="rr-note" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  id="relocation_flag"
                  name="relocation_flag"
                  type="checkbox"
                  checked={formValues.relocation_flag}
                  onChange={handleChange}
                />
                Open to relocation
              </label>
            </div>
            <div className="rr-order-section">
              <button className="rr-btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save preferences"}
              </button>
            </div>
            {representation?.eligible ? (
              <div className="rr-order-section">
                <div className="rr-field-label">Representation decision</div>
                <p className="rr-note" style={{ marginBottom: "0.75rem" }}>
                  {representation.representation_prompt_status === "accepted"
                    ? "You have already accepted RunTime representation."
                    : representation.representation_prompt_status === "declined"
                      ? "You have declined RunTime representation. You can change your mind here."
                      : "Your delivery is complete. You can now choose whether RunTime should keep you in mind for matching roles."}
                </p>
                <div className="rr-cta-row">
                  <button className="rr-btn-primary" type="button" disabled={loading} onClick={() => submitRepresentationDecision("accept")}>
                    {loading ? "Saving..." : "Accept"}
                  </button>
                  <button className="rr-btn-ghost" type="button" disabled={loading} onClick={() => submitRepresentationDecision("decline")}>
                    {loading ? "Saving..." : "Decline"}
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        ) : (
        <form onSubmit={requestLink}>
          <div className="rr-order-section">
            <label className="rr-field-label" htmlFor="dashboard_email">Your email</label>
            <input
              className="rr-input"
              id="dashboard_email"
              name="dashboard_email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter the email you used for checkout"
            />
          </div>
          <div className="rr-order-section">
            <p className="rr-note">We will email you a secure sign-in link. Open it on this device to access your dashboard.</p>
          </div>
          <div className="rr-order-section">
            <button className="rr-btn-primary" type="submit" disabled={loading || !email}>
              {loading ? "Working..." : "Send magic link"}
            </button>
          </div>
        </form>
        )}

        {token ? (
          <div className="rr-order-section">
            <div className="rr-note">Signing you in from your magic link.</div>
          </div>
        ) : null}

        {message ? <p className="rr-note mt-4" style={{ color: "#7ee081" }}>{message}</p> : null}
        {error ? <p className="rr-note mt-4" style={{ color: "#ff9d90" }}>{error}</p> : null}
      </div>

      <aside className="rr-card rr-order-panel">
        <div className="rr-field-label">{session ? "Overview" : "Your dashboard"}</div>
        {session ? (
          <>
            <div className="rr-order-summary-row"><span>Email</span><span>{session.email}</span></div>
            <div className="rr-order-summary-row"><span>Candidate ID</span><span>{session.candidate_id}</span></div>
            <div className="rr-order-summary-row"><span>Order session</span><span>{session.order_session_id || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Name</span><span>{session.full_name || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Status</span><span>{session.job_seek_status}</span></div>
            <div className="rr-order-summary-row"><span>Representation</span><span>{session.open_to_representation ? "On" : "Off"}</span></div>
            <div className="rr-order-summary-row"><span>Prompt status</span><span>{session.representation_prompt_status || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Delivered</span><span>{session.delivered_at || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Resume</span><span>{session.resume_filename || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Resume text extracted</span><span>{session.resume_text_available ? "Yes" : "No"}</span></div>
            <div className="rr-order-summary-row"><span>Roles</span><span>{session.target_roles || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Locations</span><span>{session.target_locations || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Salary</span><span>{session.salary_range || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Role types</span><span>{session.role_types || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Geography</span><span>{session.geographic_preference || "—"}</span></div>
            <div className="rr-order-summary-row"><span>Relocation</span><span>{session.relocation_flag ? "Yes" : "No"}</span></div>
            {session.has_resume ? (
              <div className="rr-order-section">
                <a className="rr-btn-ghost" href="/api/dashboard/resume">
                  Download uploaded resume
                </a>
              </div>
            ) : null}
            <div className="rr-order-section">
              <div className="rr-field-label">Sync status</div>
              <div className="rr-order-summary-row"><span>OpenCATS ID</span><span>{session.opencats_candidate_id || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Qdrant ID</span><span>{session.qdrant_point_id || "—"}</span></div>
              <div className="rr-order-summary-row"><span>OpenCATS sync</span><span>{session.last_opencats_sync_at || "—"}</span></div>
              <div className="rr-order-summary-row"><span>Qdrant sync</span><span>{session.last_qdrant_sync_at || "—"}</span></div>
            </div>
            <div className="rr-order-section">
              <div className="rr-field-label">Referral</div>
              {referral ? (
                <>
                  <div className="rr-order-summary-row"><span>Code</span><span>{referral.referral_code}</span></div>
                  <div className="rr-order-summary-row"><span>Used</span><span>{referral.times_used}</span></div>
                  <div className="rr-order-summary-row"><span>Credits</span><span>{referral.credits_earned}</span></div>
                  <div className="rr-order-summary-row"><span>Last redeemed</span><span>{referral.last_redeemed_at || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Latest reward</span><span>{referral.latest_reward_status || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Reward code</span><span>{referral.latest_reward_code || "—"}</span></div>
                  <div className="rr-order-summary-row"><span>Reward expiry</span><span>{referral.latest_reward_expires_at || "—"}</span></div>
                  <p className="rr-note" style={{ wordBreak: "break-all" }}>{referral.referral_link || "—"}</p>
                </>
              ) : (
                <p className="rr-note">Referral record not loaded yet.</p>
              )}
            </div>
            <div className="rr-order-section">
              <div className="rr-field-label">Notifications</div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="rr-card" style={{ padding: "1rem", marginBottom: "0.75rem" }}>
                    <div className="rr-order-summary-row"><span>Role</span><span>{notification.title || notification.job_id}</span></div>
                    <div className="rr-order-summary-row"><span>Company</span><span>{notification.company || "—"}</span></div>
                    <div className="rr-order-summary-row"><span>Location</span><span>{notification.location || "—"}</span></div>
                    <div className="rr-order-summary-row"><span>Match</span><span>{notification.match_score}</span></div>
                    <div className="rr-order-summary-row"><span>Status</span><span>{notification.response_status || notification.status || "sent"}</span></div>
                    {notification.summary ? <p className="rr-note">{notification.summary}</p> : null}
                    {notification.url ? <p className="rr-note" style={{ wordBreak: "break-all" }}>{notification.url}</p> : null}
                    {notification.response_status === "interested" || notification.response_status === "not_interested" ? null : (
                      <div className="rr-cta-row">
                        <button className="rr-btn-primary" type="button" disabled={loading} onClick={() => submitNotificationResponse(notification.id, "interested")}>
                          {loading ? "Saving..." : "Interested"}
                        </button>
                        <button className="rr-btn-ghost" type="button" disabled={loading} onClick={() => submitNotificationResponse(notification.id, "not_interested")}>
                          {loading ? "Saving..." : "Not interested"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="rr-note">No role notifications yet.</p>
              )}
            </div>
            <div className="rr-order-section">
              <button className="rr-btn-ghost" type="button" onClick={logout} disabled={loading}>
                {loading ? "Working..." : "Log out"}
              </button>
            </div>
          </>
        ) : (
          <p className="rr-note">Sign in with your checkout email to view your resume preferences, referral link, and job notifications.</p>
        )}
      </aside>
    </div>
  )
}
