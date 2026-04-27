import { getDb } from "@/lib/db"
import { REWRITE_PROMPT_VERSION } from "@/lib/rewrite-constants"
import { DEFAULT_REWRITE_PRESETS, normalizeRewritePresets } from "@/lib/rewrite-presets"

const SETTINGS_KEY = "rewrite_settings"

export const DEFAULT_REWRITE_SETTINGS = {
  default_provider: "",
  default_model: "",
  prompt_version: REWRITE_PROMPT_VERSION,
  presets: DEFAULT_REWRITE_PRESETS
}

function normalizeRewriteSettings(value = {}) {
  return {
    default_provider: String(value?.default_provider || "").trim(),
    default_model: String(value?.default_model || "").trim(),
    prompt_version: String(value?.prompt_version || REWRITE_PROMPT_VERSION).trim() || REWRITE_PROMPT_VERSION,
    presets: normalizeRewritePresets(value?.presets || DEFAULT_REWRITE_PRESETS)
  }
}

export function getRewriteSettings() {
  const db = getDb()
  const row = db.prepare("SELECT value_json FROM app_settings WHERE key = ?").get(SETTINGS_KEY)
  if (!row?.value_json) return normalizeRewriteSettings(DEFAULT_REWRITE_SETTINGS)

  try {
    return normalizeRewriteSettings(JSON.parse(row.value_json))
  } catch {
    return normalizeRewriteSettings(DEFAULT_REWRITE_SETTINGS)
  }
}

export function saveRewriteSettings(input = {}) {
  const db = getDb()
  const now = new Date().toISOString()
  const settings = normalizeRewriteSettings(input)

  db.prepare(`
    INSERT INTO app_settings (key, value_json, created_at, updated_at)
    VALUES (@key, @value_json, @created_at, @updated_at)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = excluded.updated_at
  `).run({
    key: SETTINGS_KEY,
    value_json: JSON.stringify(settings),
    created_at: now,
    updated_at: now
  })

  return settings
}

export function resolveRewriteRuntimeSettings(overrides = {}) {
  const settings = getRewriteSettings()
  const presets = settings.presets || DEFAULT_REWRITE_PRESETS
  const presetId = String(overrides?.presetId || "").trim()
  const selectedPreset = presetId ? presets.find((preset) => preset.id === presetId) : null

  return {
    provider: String(overrides?.provider || "").trim() || selectedPreset?.provider || settings.default_provider,
    model: String(overrides?.model || "").trim() || selectedPreset?.model || settings.default_model,
    promptVersion: String(overrides?.promptVersion || "").trim() || selectedPreset?.prompt_version || settings.prompt_version,
    settings,
    selectedPreset
  }
}
