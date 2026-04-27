import { REWRITE_PROMPT_VERSION } from "@/lib/rewrite-constants"

export const DEFAULT_REWRITE_PRESETS = [
  { id: "env", label: "Env Default", provider: "", model: "", prompt_version: "" },
  { id: "gpt5mini", label: "OpenAI GPT-5 Mini", provider: "openai_responses", model: "gpt-5-mini", prompt_version: REWRITE_PROMPT_VERSION },
  { id: "gpt5", label: "OpenAI GPT-5", provider: "openai_responses", model: "gpt-5", prompt_version: REWRITE_PROMPT_VERSION },
  { id: "localqwen", label: "Local LLM", provider: "local_openai", model: "qwen", prompt_version: REWRITE_PROMPT_VERSION },
  { id: "custom", label: "Custom", provider: null, model: null, prompt_version: null }
]

function normalizePresetId(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || fallback
}

export function normalizeRewritePresets(presets = []) {
  const normalized = []
  const seen = new Set()

  for (const preset of Array.isArray(presets) ? presets : []) {
    const label = String(preset?.label || "").trim()
    const provider = preset?.provider === null ? null : String(preset?.provider || "").trim()
    const model = preset?.model === null ? null : String(preset?.model || "").trim()
    const promptVersion = preset?.prompt_version === null ? null : String(preset?.prompt_version || "").trim()
    if (!label) continue

    const id = normalizePresetId(preset?.id, `preset_${normalized.length + 1}`)
    if (seen.has(id)) continue

    seen.add(id)
    normalized.push({ id, label, provider, model, prompt_version: promptVersion })
  }

  const envPreset = normalized.find((preset) => preset.id === "env") || { id: "env", label: "Env Default", provider: "", model: "", prompt_version: "" }
  const customPreset = normalized.find((preset) => preset.id === "custom") || { id: "custom", label: "Custom", provider: null, model: null, prompt_version: null }
  const middlePresets = normalized.filter((preset) => preset.id !== "env" && preset.id !== "custom")

  return [envPreset, ...middlePresets, customPreset]
}

export function findMatchingRewritePreset(provider = "", model = "", presets = DEFAULT_REWRITE_PRESETS) {
  const normalizedProvider = String(provider || "").trim()
  const normalizedModel = String(model || "").trim()
  const availablePresets = normalizeRewritePresets(presets)

  return availablePresets.find((preset) => (
    preset.provider !== null &&
    preset.model !== null &&
    preset.provider === normalizedProvider &&
    preset.model === normalizedModel
  )) || availablePresets.find((preset) => preset.id === "custom")
}
