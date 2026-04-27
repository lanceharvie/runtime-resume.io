"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const LAST_ACTIVITY_KEY = "runtime_resume_admin_last_activity"
const LOGOUT_SIGNAL_KEY = "runtime_resume_admin_logout_signal"
const ACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000
const TOUCH_INTERVAL_MS = 5 * 60 * 1000

export default function AdminSessionControls() {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const touchRef = useRef(0)
  const expiredRef = useRef(false)

  const isLoginPage = pathname === "/admin/login"

  async function logout(reason = "logout") {
    if (loggingOut || expiredRef.current) return
    expiredRef.current = true
    setLoggingOut(true)

    try {
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      localStorage.setItem(LOGOUT_SIGNAL_KEY, String(Date.now()))
    } catch {}

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true
      })
    } catch {}

    window.location.href = `/admin/login?reason=${encodeURIComponent(reason)}`
  }

  async function touch(force = false) {
    if (expiredRef.current || isLoginPage) return

    const now = Date.now()
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
    } catch {}

    if (!force && now - touchRef.current < TOUCH_INTERVAL_MS) return
    touchRef.current = now

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        keepalive: true
      })
      if (response.status === 401) {
        await logout("timeout")
      }
    } catch {}
  }

  useEffect(() => {
    if (isLoginPage) return undefined

    const activityHandler = () => {
      void touch(false)
    }

    const checkExpiry = () => {
      try {
        const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || "0")
        if (lastActivity && Date.now() - lastActivity > ACTIVITY_TIMEOUT_MS) {
          void logout("timeout")
        }
      } catch {}
    }

    const storageHandler = (event) => {
      if (event.key === LOGOUT_SIGNAL_KEY && event.newValue) {
        window.location.href = "/admin/login?reason=logout"
      }
      if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
        checkExpiry()
      }
    }

    try {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || "0")
      if (lastActivity && Date.now() - lastActivity > ACTIVITY_TIMEOUT_MS) {
        void logout("timeout")
        return undefined
      }
    } catch {}

    void touch(true)

    const events = ["pointerdown", "keydown", "mousemove", "scroll", "touchstart"]
    events.forEach((name) => window.addEventListener(name, activityHandler, { passive: true }))
    document.addEventListener("visibilitychange", activityHandler)
    window.addEventListener("storage", storageHandler)
    const intervalId = window.setInterval(checkExpiry, 60 * 1000)

    return () => {
      events.forEach((name) => window.removeEventListener(name, activityHandler))
      document.removeEventListener("visibilitychange", activityHandler)
      window.removeEventListener("storage", storageHandler)
      window.clearInterval(intervalId)
    }
  }, [isLoginPage])

  if (isLoginPage) return null

  function handleOrdersClick(event) {
    if (pathname !== "/admin/orders") return
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="rr-container" style={{ paddingTop: "1rem" }}>
        <div className="rr-card rr-order-panel" style={{ padding: "0.85rem 1rem" }}>
          <div className="rr-order-summary-row" style={{ gap: "1rem", alignItems: "center" }}>
            <div>
              <strong>Admin session</strong>
              <p className="rr-note">Auto timeout after 2 hours of inactivity.</p>
            </div>
            <div className="rr-cta-row" style={{ marginBottom: 0 }}>
              <Link
                className="rr-btn-ghost"
                href="/admin/orders"
                onClick={handleOrdersClick}
                aria-current={pathname === "/admin/orders" ? "page" : undefined}
              >
                Orders
              </Link>
              <Link className="rr-btn-ghost" href="/admin/reviewer-queue">Reviewer queue</Link>
              <Link className="rr-btn-ghost" href="/admin/settings">Settings</Link>
              <button className="rr-btn-primary" type="button" onClick={() => logout("logout")} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
