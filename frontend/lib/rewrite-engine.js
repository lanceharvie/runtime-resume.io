import { REWRITE_PROMPT_VERSION } from "@/lib/rewrite-constants"
import { generateTier2RewriteDraftWithLlm, isLlmRewriteEnabled } from "@/lib/llm/rewrite-client"

const NICHE_SKILLS = {
  embedded_firmware: ["C", "C++", "RTOS", "STM32", "UART", "SPI", "I2C", "CAN", "ARM", "Bootloader"],
  fpga: ["Verilog", "VHDL", "SystemVerilog", "Vivado", "Quartus", "RTL", "Timing Closure"],
  dsp: ["DSP", "MATLAB", "FFT", "Fixed-point", "Filters", "Signal Processing"],
  robotics: ["ROS", "ROS2", "Controls", "Sensor Fusion", "Autonomy", "Motion Planning"],
  hardware_design: ["PCB", "Altium", "Schematic Capture", "Board Bring-up", "Power Electronics", "Signal Integrity"],
  general_hardware: ["Embedded Systems", "Hardware Design", "Debugging", "Validation", "Systems Integration"]
}

function cleanLines(text) {
  return String(text || "")
    .split(String.fromCharCode(10))
    .map((line) => line.replaceAll(String.fromCharCode(13), "").trim())
    .filter(Boolean)
}

function bulletLines(lines) {
  return lines.filter((line) => /^[-•*]/.test(line)).map((line) => line.replace(/^[-•*]\s*/, ""))
}

function selectSkills(audit, text) {
  const niche = audit?.candidate_profile?.niche || "general_hardware"
  const lower = String(text || "").toLowerCase()
  const nicheSkills = NICHE_SKILLS[niche] || NICHE_SKILLS.general_hardware
  const matched = nicheSkills.filter((skill) => lower.includes(skill.toLowerCase()))
  return (matched.length ? matched : nicheSkills).slice(0, 8)
}

function buildSummary({ intake, audit }) {
  const niche = (audit?.candidate_profile?.niche || "general_hardware").replace(/_/g, " ")
  const seniority = audit?.candidate_profile?.seniority || "mid"
  const targetRoles = intake?.target_roles || "technical engineering roles"
  const market = intake?.geographic_preference || "the target market"
  return `${seniority.charAt(0).toUpperCase() + seniority.slice(1)} ${niche} engineer targeting ${targetRoles}. Resume rewrite should emphasize recruiter-readable technical scope, stronger page-one positioning, and clearer alignment to ${market}.`
}

function buildExperienceDraft(lines, intake, audit) {
  const bullets = bulletLines(lines)
  const sourceBullets = bullets.slice(0, 6)
  if (!sourceBullets.length) {
    return [
      {
        title: intake?.target_roles || "Target role alignment",
        bullets: [
          "Lead each role with the system scope, stack, and engineering environment rather than generic responsibilities.",
          "Rewrite achievements into outcome-driven bullets using the candidate's actual technologies and delivery context.",
          "Flag missing metrics or scope details for candidate confirmation before final delivery."
        ]
      }
    ]
  }

  return [
    {
      title: intake?.target_roles || `${audit?.candidate_profile?.niche || "engineering"} experience`,
      bullets: sourceBullets.map((bullet) => `Rewrite around technical ownership and outcome: ${bullet}`)
    }
  ]
}

export function generateTier2RewriteDraft({ order, intake, auditRun, overrides = {} }) {
  const extractedText = auditRun?.extracted_text || ""
  const lines = cleanLines(extractedText)
  const audit = auditRun?.audit || {}
  const skills = selectSkills(audit, extractedText)
  const promptVersion = String(overrides?.promptVersion || "").trim() || REWRITE_PROMPT_VERSION

  return {
    meta: {
      source_audit_id: auditRun?.id || null,
      source_filename: auditRun?.source_filename || intake?.resume_filename || "",
      source_path: auditRun?.source_path || intake?.resume_path || "",
      generated_from: "deterministic_rewrite_v1",
      generator_source: "deterministic_rewrite_v1",
      llm_provider: "deterministic",
      llm_model: "heuristic",
      prompt_version: promptVersion
    },
    positioning_summary: buildSummary({ intake, audit }),
    summary: buildSummary({ intake, audit }),
    skills_section: skills,
    experience_sections: buildExperienceDraft(lines, intake, audit),
    rewrite_notes: [
      `Preserve factual claims from ${order?.tier_name || order?.tier || "the order"} intake and uploaded resume only.`,
      "Use the draft as a first-pass rewrite scaffold, then tighten wording manually before delivery.",
      "Request confirmation for missing scope, metrics, team size, or product context before finalizing bullets."
    ]
  }
}

export async function generateBestAvailableTier2RewriteDraft({ order, intake, auditRun, overrides = {} }) {
  const deterministicDraft = generateTier2RewriteDraft({ order, intake, auditRun, overrides })

  if (!isLlmRewriteEnabled(overrides)) {
    return deterministicDraft
  }

  try {
    const llmResult = await generateTier2RewriteDraftWithLlm({ order, intake, auditRun, deterministicDraft, overrides })
    return {
      ...deterministicDraft,
      ...llmResult.rewrite,
      llm_trace: llmResult.trace,
      meta: {
        ...deterministicDraft.meta,
        generated_from: llmResult.meta.generator_source,
        ...llmResult.meta
      }
    }
  } catch (error) {
    return {
      ...deterministicDraft,
      llm_trace: error?.trace || null,
      meta: {
        ...deterministicDraft.meta,
        generated_from: "deterministic_rewrite_v1_fallback",
        generator_source: "deterministic_rewrite_v1_fallback",
        llm_error: error instanceof Error ? error.message : "LLM rewrite generation failed"
      }
    }
  }
}
