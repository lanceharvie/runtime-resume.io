function effectiveScores(auditRun) {
  const baseScores = auditRun?.audit?.scores || {}
  const overrides = auditRun?.reviewer_override || {}

  return Object.fromEntries(
    Object.entries(baseScores).map(([key, value]) => [key, overrides[key] ?? value])
  )
}

function weightedTotal(scores) {
  return Number(
    (
      (scores.ats_compatibility || 0) * 0.2 +
      (scores.technical_clarity || 0) * 0.25 +
      (scores.relevance_weighting || 0) * 0.2 +
      (scores.career_narrative || 0) * 0.2 +
      (scores.format_readability || 0) * 0.15
    ).toFixed(2)
  )
}

function overallVerdict(total) {
  if (total >= 4.2) return "Strong signal"
  if (total >= 3.5) return "Promising, but needs tightening"
  if (total >= 2.7) return "Mixed signal"
  return "Likely being screened out"
}

export function buildReviewedReport({ order, intake, auditRun }) {
  const audit = auditRun?.audit || {}
  const scores = effectiveScores(auditRun)
  const total = weightedTotal(scores)

  return {
    candidate: {
      email: order?.customer_email || "",
      target_roles: intake?.target_roles || "",
      geographic_preference: intake?.geographic_preference || "",
      years_experience: intake?.years_experience || ""
    },
    profile: audit.candidate_profile || {},
    scores,
    weighted_total: total,
    verdict: overallVerdict(total),
    top_issues: audit.top_issues || [],
    recommendations: audit.recommendations || [],
    recruiter_notes: audit.recruiter_notes || [],
    candidate_summary: audit.candidate_summary || "",
    reviewer_notes: auditRun?.reviewer_notes || "",
    generated_at: auditRun?.updated_at || auditRun?.created_at || ""
  }
}
