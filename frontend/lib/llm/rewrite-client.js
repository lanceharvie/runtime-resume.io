import { loadRewritePrompts } from "@/lib/llm/prompt-loader"

function getConfig(overrides = {}) {
  const provider = overrides.provider || process.env.RUNTIME_RESUME_LLM_PROVIDER || "openai_responses"

  const apiUrlByProvider = {
    openai_responses: process.env.RUNTIME_RESUME_OPENAI_API_URL || process.env.RUNTIME_RESUME_LLM_API_URL || "",
    local_openai: process.env.RUNTIME_RESUME_LOCAL_LLM_API_URL || process.env.RUNTIME_RESUME_LLM_API_URL || ""
  }

  const apiKeyByProvider = {
    openai_responses: process.env.RUNTIME_RESUME_OPENAI_API_KEY || process.env.RUNTIME_RESUME_LLM_API_KEY || "",
    local_openai: process.env.RUNTIME_RESUME_LOCAL_LLM_API_KEY || process.env.RUNTIME_RESUME_LLM_API_KEY || ""
  }

  return {
    provider,
    apiUrl: overrides.apiUrl || apiUrlByProvider[provider] || process.env.RUNTIME_RESUME_LLM_API_URL || "",
    apiKey: overrides.apiKey || apiKeyByProvider[provider] || process.env.RUNTIME_RESUME_LLM_API_KEY || "",
    model: overrides.model || process.env.RUNTIME_RESUME_LLM_MODEL || "gpt-5-mini"
  }
}

function stripFences(text) {
  return String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim()
}

function normalizeRewritePayload(payload) {
  const result = payload && typeof payload === "object" ? payload : {}
  return {
    positioning_summary: String(result.positioning_summary || "").trim(),
    summary: String(result.summary || "").trim(),
    skills_section: Array.isArray(result.skills_section) ? result.skills_section.map((item) => String(item || "").trim()).filter(Boolean) : [],
    experience_sections: Array.isArray(result.experience_sections)
      ? result.experience_sections.map((section) => ({
          title: String(section?.title || "").trim(),
          bullets: Array.isArray(section?.bullets) ? section.bullets.map((bullet) => String(bullet || "").trim()).filter(Boolean) : []
        }))
      : [],
    rewrite_notes: Array.isArray(result.rewrite_notes) ? result.rewrite_notes.map((item) => String(item || "").trim()).filter(Boolean) : []
  }
}

function buildPromptInput(prompts, input) {
  return `${prompts.rewrite}\n\nInput JSON:\n${JSON.stringify(input)}`
}

function buildOpenAiResponsesRequest({ model, prompts, input }) {
  return {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: prompts.system }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: buildPromptInput(prompts, input) }]
      }
    ],
    text: {
      format: {
        type: "json_object"
      }
    }
  }
}

function buildGenericRequest({ model, prompts, input }) {
  return {
    model,
    messages: [
      { role: "system", content: prompts.system },
      { role: "user", content: buildPromptInput(prompts, input) }
    ],
    response_format: { type: "json_object" }
  }
}

function extractOpenAiResponsesText(payload) {
  if (payload?.output_text) return payload.output_text

  const parts = []
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") parts.push(content.text)
    }
  }

  return parts.join(String.fromCharCode(10)).trim()
}

function extractResponseContent(provider, payload) {
  if (provider === "openai_responses") {
    const text = extractOpenAiResponsesText(payload)
    if (text) return text
  }

  if (provider === "local_openai") {
    return payload?.choices?.[0]?.message?.content || payload?.output_text || payload?.response || payload
  }

  return payload?.output_text || payload?.content || payload?.message?.content || payload?.choices?.[0]?.message?.content || payload?.response || payload
}

export function isLlmRewriteEnabled(overrides = {}) {
  const config = getConfig(overrides)
  return Boolean(config.apiUrl)
}

export async function generateTier2RewriteDraftWithLlm({ order, intake, auditRun, deterministicDraft, overrides = {} }) {
  const config = getConfig(overrides)
  if (!config.apiUrl) {
    throw new Error("LLM rewrite generation is not configured")
  }

  const prompts = loadRewritePrompts({ versionOverride: overrides.promptVersion })
  const input = {
    order: {
      tier: order?.tier || "",
      tier_name: order?.tier_name || "",
      customer_email: order?.customer_email || ""
    },
    intake: intake || {},
    audit: auditRun?.audit || {},
    extracted_text: auditRun?.extracted_text || "",
    deterministic_draft: deterministicDraft || {}
  }

  const body = config.provider === "openai_responses"
    ? buildOpenAiResponsesRequest({ model: config.model, prompts, input })
    : buildGenericRequest({ model: config.model, prompts, input })

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    const error = new Error(text || `LLM rewrite request failed with status ${response.status}`)
    error.trace = {
      trace_status: "error",
      provider: config.provider,
      model: config.model,
      prompt_version: prompts.version,
      request_body: body,
      response_body: { status: response.status, body: text },
      error_message: text || `LLM rewrite request failed with status ${response.status}`
    }
    throw error
  }

  const payload = await response.json().catch(() => ({}))
  const content = extractResponseContent(config.provider, payload)
  const parsed = typeof content === "string" ? JSON.parse(stripFences(content)) : content

  return {
    rewrite: normalizeRewritePayload(parsed),
    meta: {
      generator_source: "llm_rewrite_v1",
      llm_provider: config.provider,
      llm_model: config.model,
      prompt_version: prompts.version
    },
    trace: {
      trace_status: "success",
      provider: config.provider,
      model: config.model,
      prompt_version: prompts.version,
      request_body: body,
      response_body: payload
    }
  }
}
