const NICHE_KEYWORDS = {
  embedded_firmware: ["embedded", "firmware", "rtos", "bare-metal", "stm32", "uart", "spi", "i2c", "can", "arm", "bootloader"],
  fpga: ["fpga", "verilog", "vhdl", "systemverilog", "vivado", "quartus", "rtl", "timing"],
  dsp: ["dsp", "signal processing", "fft", "matlab", "fixed-point", "filter"],
  robotics: ["robotics", "ros", "ros2", "controls", "sensor fusion", "autonomy", "motion planning"],
  hardware_design: ["hardware", "pcb", "altium", "schematic", "board bring-up", "power electronics", "signal integrity"]
}

function countMatches(text, patterns) {
  const lower = text.toLowerCase()
  return patterns.reduce((sum, pattern) => sum + (lower.includes(pattern.toLowerCase()) ? 1 : 0), 0)
}

function clampScore(value) {
  return Math.max(1, Math.min(5, Math.round(value)))
}

function inferNiche(text) {
  const entries = Object.entries(NICHE_KEYWORDS).map(([key, words]) => [key, countMatches(text, words)])
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]?.[1] > 0 ? entries[0][0] : "general_hardware"
}

function inferSeniority(text, yearsExperience) {
  const lower = text.toLowerCase()
  const years = Number.parseInt(String(yearsExperience || "").replace(/[^\d]/g, ""), 10)
  if (years >= 10 || /principal|staff|lead|manager|architect|director/.test(lower)) return "senior"
  if (years >= 4 || /senior|team lead/.test(lower)) return "mid"
  return "junior"
}

function buildIssues(scores, context) {
  const issues = []

  if (scores.relevance_weighting <= 3) {
    issues.push({
      dimension: "relevance_weighting",
      issue: "Target-role signal is not strong enough early in the document.",
      evidence: `Target roles entered: ${context.targetRoles || "not provided"}. The current resume does not appear to surface that positioning clearly on page one.`
    })
  }

  if (scores.technical_clarity <= 3) {
    issues.push({
      dimension: "technical_clarity",
      issue: "Technical specificity is too soft for a specialist engineering screen.",
      evidence: `Detected niche: ${context.niche}. The resume needs clearer tooling, systems, protocols, and ownership language.`
    })
  }

  if (scores.ats_compatibility <= 3) {
    issues.push({
      dimension: "ats_compatibility",
      issue: "The resume may not be surfacing keywords and sections in an ATS-friendly way.",
      evidence: "The parser found weak or uneven section coverage, which usually correlates with poor ATS readability."
    })
  }

  if (scores.career_narrative <= 3) {
    issues.push({
      dimension: "career_narrative",
      issue: "The progression story is not obvious enough from the extracted text.",
      evidence: "Titles, transitions, or scope changes are not clearly forming a progression narrative."
    })
  }

  if (scores.format_readability <= 3) {
    issues.push({
      dimension: "format_readability",
      issue: "The extracted structure is harder to scan than it should be.",
      evidence: "Dense text and weak section separation reduce skim speed for recruiters."
    })
  }

  return issues.slice(0, 3)
}

function buildRecommendations(context) {
  return [
    {
      priority: 1,
      action: "Strengthen the first-page role signal.",
      example: `Lead with a summary that states the target niche directly, for example: "${context.niche.replace(/_/g, " ")} engineer focused on ..."`,
      rationale: "The first scan needs to make the role fit obvious in under 15 seconds."
    },
    {
      priority: 2,
      action: "Rewrite experience bullets around systems, tools, and outcomes.",
      example: "Replace generic responsibility bullets with technical scope, environment, and results.",
      rationale: "Recruiters and hiring managers respond to evidence, not task lists."
    },
    {
      priority: 3,
      action: "Align keywords to the actual target roles and market.",
      example: `Mirror the language used in the desired roles: ${context.targetRoles || "target roles not supplied"}.`,
      rationale: "Relevance weighting and keyword alignment directly affect both ATS and recruiter confidence."
    }
  ]
}

export function generateTier1Audit({ order, intake, extractedText, parser }) {
  const text = String(extractedText || "")
  const lower = text.toLowerCase()
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const niche = inferNiche(text)
  const seniority = inferSeniority(text, intake?.years_experience)
  const targetRoles = intake?.target_roles || ""
  const roleTerms = targetRoles
    .split(/[,/\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const sectionSignals = countMatches(lower, ["experience", "education", "skills", "summary", "projects"])
  const keywordHits = countMatches(text, NICHE_KEYWORDS[niche] || [])
  const roleHits = roleTerms.length ? countMatches(text, roleTerms) : 0
  const bulletLines = lines.filter((line) => /^[-•*]/.test(line)).length
  const avgLineLength = lines.length ? lines.reduce((sum, line) => sum + line.length, 0) / lines.length : 0
  const contactSignals = countMatches(lower, ["@", "linkedin.com", "phone", "+61", "+1"])

  const scores = {
    ats_compatibility: clampScore(1.5 + sectionSignals * 0.45 + contactSignals * 0.5),
    technical_clarity: clampScore(1.2 + keywordHits * 0.35),
    relevance_weighting: clampScore(1.5 + roleHits * 0.8 + (targetRoles ? 0.5 : 0)),
    career_narrative: clampScore(1.8 + countMatches(lower, ["lead", "senior", "principal", "manager", "architect"]) * 0.5),
    format_readability: clampScore(2 + (bulletLines > 5 ? 1 : 0) + (avgLineLength < 120 ? 1 : 0) + (sectionSignals > 3 ? 0.5 : 0))
  }

  const weightedTotal = Number(
    (
      scores.ats_compatibility * 0.2 +
      scores.technical_clarity * 0.25 +
      scores.relevance_weighting * 0.2 +
      scores.career_narrative * 0.2 +
      scores.format_readability * 0.15
    ).toFixed(2)
  )

  const scoreReasons = {
    ats_compatibility: `Detected ${sectionSignals} common resume section signals and ${contactSignals} contact signals via ${parser}.`,
    technical_clarity: `Detected ${keywordHits} niche-specific technical keyword hits for ${niche}.`,
    relevance_weighting: roleTerms.length
      ? `Matched ${roleHits} target-role terms from the intake against the resume text.`
      : "No target-role terms were supplied, so relevance weighting is based mainly on extracted domain language.",
    career_narrative: `Seniority inferred as ${seniority} from titles, experience clues, and intake context.`,
    format_readability: `Found ${bulletLines} bullet-like lines with an average line length of ${Math.round(avgLineLength || 0)} characters.`
  }

  const context = {
    niche,
    targetRoles,
    parser
  }

  const topIssues = buildIssues(scores, context)
  const recommendations = buildRecommendations(context)

  return {
    candidate_profile: {
      niche,
      seniority,
      target_market: intake?.geographic_preference || "not specified"
    },
    scores,
    weighted_total: weightedTotal,
    score_reasons: scoreReasons,
    top_issues: topIssues,
    recommendations,
    recruiter_notes: [
      "Page-one signal matters more than candidates think. The niche and target role need to be obvious immediately.",
      "Specialist engineering resumes need concrete technical evidence, not general project responsibility language.",
      `This first pass is deterministic and based on extracted text from the uploaded file via ${parser}.`
    ],
    candidate_summary: `This first pass suggests the resume is strongest in ${Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0].replace(/_/g, " ")} and weakest in ${Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0].replace(/_/g, " ")}. The document needs sharper ${niche.replace(/_/g, " ")} positioning and clearer evidence for the target roles.`,
    meta: {
      parser,
      extracted_characters: text.length,
      extracted_lines: lines.length,
      target_roles_supplied: roleTerms.length
    }
  }
}
