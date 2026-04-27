import crypto from "node:crypto"
import { NextResponse } from "next/server"

export const ADMIN_SESSION_COOKIE_NAME = "runtime_resume_admin_session"
export const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))

  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function getAdminUsername() {
  return process.env.RUNTIME_RESUME_ADMIN_USER || ""
}

export function getAdminPassword() {
  return process.env.RUNTIME_RESUME_ADMIN_PASSWORD || ""
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminUsername() && getAdminPassword())
}

export function isValidAdminAuthorizationHeader(header) {
  if (!header || !header.startsWith("Basic ")) return false
  if (!isAdminAuthConfigured()) return false

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
    const separator = decoded.indexOf(":")
    if (separator === -1) return false

    const username = decoded.slice(0, separator)
    const password = decoded.slice(separator + 1)

    return (
      timingSafeEqualString(username, getAdminUsername()) &&
      timingSafeEqualString(password, getAdminPassword())
    )
  } catch {
    return false
  }
}

function getAdminSessionSecret() {
  return process.env.RUNTIME_RESUME_DELIVERY_SECRET || getAdminPassword() || ""
}

export function createAdminSessionToken(expiresAt = Date.now() + ADMIN_SESSION_TTL_MS) {
  const secret = getAdminSessionSecret()
  if (!secret) {
    throw new Error("Admin session secret is not configured")
  }

  const payload = String(expiresAt)
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function isValidAdminSessionToken(token) {
  if (!token) return false

  try {
    const [payload, signature] = String(token).split(".")
    if (!payload || !signature) return false
    const expiresAt = Number(payload)
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

    const expected = createAdminSessionToken(expiresAt)
    return timingSafeEqualString(expected, token)
  } catch {
    return false
  }
}

export function getAdminSessionCookieValue(request) {
  return request?.cookies?.get?.(ADMIN_SESSION_COOKIE_NAME)?.value || ""
}

export function hasValidAdminSessionRequest(request) {
  return isValidAdminSessionToken(getAdminSessionCookieValue(request))
}

export function hasAdminAccessRequest(request) {
  const authorization = request?.headers?.get?.("authorization") || ""
  const adminSessionToken = getAdminSessionCookieValue(request)
  return hasAdminAccess({ authorization, adminSessionToken })
}

export function hasAdminAccess({ authorization, adminSessionToken }) {
  return (
    isValidAdminSessionToken(adminSessionToken) ||
    isValidAdminAuthorizationHeader(authorization)
  )
}

export function applyAdminSessionCookie(response, expiresAt = Date.now() + ADMIN_SESSION_TTL_MS) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
    secure: false
  })
  return response
}

export function clearAdminSessionCookie(response) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    secure: false
  })
  return response
}

export function createAdminUnauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="RunTime Resume Admin"'
    }
  })
}

export function createAdminUnauthorizedJsonResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="RunTime Resume Admin"'
      }
    }
  )
}

function getDeliverySecret() {
  return process.env.RUNTIME_RESUME_DELIVERY_SECRET || process.env.RUNTIME_RESUME_ADMIN_PASSWORD || ""
}

export function createDeliveryAccessToken(sessionId) {
  const secret = getDeliverySecret()
  if (!secret) {
    throw new Error("RUNTIME_RESUME_DELIVERY_SECRET or RUNTIME_RESUME_ADMIN_PASSWORD must be configured")
  }

  return crypto
    .createHmac("sha256", secret)
    .update(String(sessionId))
    .digest("base64url")
}

export function isValidDeliveryAccessToken(sessionId, token) {
  if (!token) return false

  try {
    const expected = createDeliveryAccessToken(sessionId)
    return timingSafeEqualString(expected, token)
  } catch {
    return false
  }
}

export function hasDeliveryAccess({ sessionId, token, authorization, adminSessionToken }) {
  return (
    isValidDeliveryAccessToken(sessionId, token) ||
    hasAdminAccess({ authorization, adminSessionToken })
  )
}
