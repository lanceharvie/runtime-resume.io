import fs from "node:fs"
import path from "node:path"

export const REWRITE_PROMPT_VERSION = "runtime_resume_tier2_v1"

const DEFAULT_SYSTEM_PROMPT = `You are RunTime Resume's AI rewrite assistant.
You rewrite technical engineering resumes for embedded systems, firmware, FPGA, DSP, robotics, electronics, and hardware roles.
Stay factual, recruiter-credible, and concise. Do not invent metrics, scope, tools, or achievements.`

const DEFAULT_REWRITE_PROMPT = `Create a Tier 2 resume rewrite draft using the provided resume text, intake, and audit context.
Return strict JSON with keys: positioning_summary, summary, skills_section, experience_sections, rewrite_notes.
experience_sections must be an array of objects with title and bullets.
Do not include markdown fences.`

function readPrompt(relativePath, fallback) {
  try {
    const fullPath = path.resolve(process.cwd(), "..", relativePath)
    if (!fs.existsSync(fullPath)) return fallback
    return fs.readFileSync(fullPath, "utf8")
  } catch {
    return fallback
  }
}

export function loadRewritePrompts(options = {}) {
  const versionOverride = String(options?.versionOverride || "").trim()

  return {
    system: readPrompt("prompts/system_resume_reviewer.txt", DEFAULT_SYSTEM_PROMPT),
    rewrite: readPrompt("prompts/tier2_rewrite.txt", DEFAULT_REWRITE_PROMPT),
    version: versionOverride || REWRITE_PROMPT_VERSION
  }
}
