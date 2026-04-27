function getPipelineApiBaseUrl() {
  return process.env.PIPELINE_API_BASE_URL || process.env.NEXT_PUBLIC_PIPELINE_API_BASE_URL || ""
}

function getPipelineApiInternalKey() {
  return process.env.PIPELINE_API_INTERNAL_KEY || ""
}

export function isPipelineApiConfigured() {
  return Boolean(getPipelineApiBaseUrl())
}

async function pipelineApiRequest(path, payload) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getPipelineApiInternalKey() ? { "X-Internal-Api-Key": getPipelineApiInternalKey() } : {})
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline intake submission failed")
  }

  return data
}

async function pipelineApiInternalGet(path) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      ...(getPipelineApiInternalKey() ? { "X-Internal-Api-Key": getPipelineApiInternalKey() } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline request failed")
  }

  return data
}

export async function submitPipelineIntake(payload) {
  return pipelineApiRequest("/api/intake/submit", payload)
}

export async function notifyPipelineDeliveryComplete(sessionId, payload = {}) {
  return pipelineApiRequest(`/api/internal/orders/${encodeURIComponent(sessionId)}/delivery-complete`, payload)
}

export async function notifyPipelineStripeWebhook(payload) {
  return pipelineApiRequest("/api/stripe/webhooks", payload)
}

export async function getPipelineCheckoutReferral(referralCode) {
  return pipelineApiInternalGet(`/api/internal/referrals/${encodeURIComponent(referralCode)}`)
}

export async function getPipelineRepresentationPrompt(sessionId) {
  return pipelineApiInternalGet(`/api/internal/orders/${encodeURIComponent(sessionId)}/representation`)
}

export async function submitPipelineRepresentationDecision(sessionId, payload) {
  return pipelineApiRequest(`/api/internal/orders/${encodeURIComponent(sessionId)}/representation`, payload)
}

export async function requestPipelineMagicLink(payload) {
  return pipelineApiRequest("/api/dashboard/auth/request-link", payload)
}

export async function verifyPipelineMagicLink(payload) {
  return pipelineApiRequest("/api/dashboard/auth/verify", payload)
}

export async function getPipelineDashboardSession(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/me`, {
    method: "GET",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard session lookup failed")
  }

  return data
}

export async function updatePipelineDashboardPreferences(sessionToken, payload) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard preference update failed")
  }

  return data
}

export async function getPipelineDashboardReferral(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/referral`, {
    method: "GET",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard referral lookup failed")
  }

  return data
}

export async function getPipelineDashboardRepresentation(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/representation`, {
    method: "GET",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard representation lookup failed")
  }

  return data
}

export async function submitPipelineDashboardRepresentation(sessionToken, payload) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/representation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard representation update failed")
  }

  return data
}

export async function getPipelineDashboardNotifications(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/notifications`, {
    method: "GET",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard notifications lookup failed")
  }

  return data
}

export async function getPipelineDashboardResume(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/resume`, {
    method: "GET",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || data.error || "Pipeline dashboard resume download failed")
  }

  return response
}

export async function respondToPipelineDashboardNotification(sessionToken, notificationId, payload) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/notifications/${encodeURIComponent(notificationId)}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard notification response failed")
  }

  return data
}

export async function logoutPipelineDashboardSession(sessionToken) {
  const baseUrl = getPipelineApiBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/api/dashboard/auth/logout`, {
    method: "POST",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    },
    cache: "no-store"
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.error || "Pipeline dashboard logout failed")
  }

  return data
}
