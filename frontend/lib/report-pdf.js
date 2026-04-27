import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

function drawWrappedText(page, text, x, y, options) {
  const {
    font,
    size = 11,
    color = rgb(0, 0, 0),
    maxWidth,
    lineHeight = 15
  } = options

  const words = String(text || "").split(/\s+/)
  let line = ""
  let cursorY = y

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    const width = font.widthOfTextAtSize(candidate, size)

    if (width > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, font, size, color })
      cursorY -= lineHeight
      line = word
    } else {
      line = candidate
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, font, size, color })
    cursorY -= lineHeight
  }

  return cursorY
}

function ensureSpace(doc, pageState, minY = 72) {
  if (pageState.y > minY) return pageState

  const page = doc.addPage([595, 842])
  return { page, y: 770 }
}

export async function buildSignalCheckPdf({ report, sessionId }) {
  const doc = await PDFDocument.create()
  const pageMargin = 50
  const pageWidth = 595
  const contentWidth = pageWidth - pageMargin * 2
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontSerif = await doc.embedFont(StandardFonts.TimesRomanBold)

  let page = doc.addPage([595, 842])
  let y = 770

  page.drawText("RunTime Resume", {
    x: pageMargin,
    y,
    font: fontBold,
    size: 12,
    color: rgb(0.75, 0.22, 0.17)
  })

  y -= 30
  page.drawText("Signal Check Report", {
    x: pageMargin,
    y,
    font: fontSerif,
    size: 24,
    color: rgb(0.1, 0.1, 0.1)
  })

  y -= 24
  page.drawText(report.verdict, {
    x: pageMargin,
    y,
    font: fontBold,
    size: 13,
    color: rgb(0.2, 0.2, 0.2)
  })

  y -= 24
  const metaLines = [
    `Session: ${sessionId}`,
    `Email: ${report.candidate.email || "—"}`,
    `Target roles: ${report.candidate.target_roles || "—"}`,
    `Market: ${report.candidate.geographic_preference || "—"}`,
    `Generated: ${report.generated_at ? new Date(report.generated_at).toLocaleString("en-AU") : "—"}`
  ]

  for (const line of metaLines) {
    page.drawText(line, {
      x: pageMargin,
      y,
      font: fontRegular,
      size: 10,
      color: rgb(0.32, 0.32, 0.32)
    })
    y -= 14
  }

  y -= 10
  page.drawText("Overall assessment", {
    x: pageMargin,
    y,
    font: fontBold,
    size: 14,
    color: rgb(0.1, 0.1, 0.1)
  })
  y -= 18
  y = drawWrappedText(page, report.candidate_summary, pageMargin, y, {
    font: fontRegular,
    size: 11,
    color: rgb(0.22, 0.22, 0.22),
    maxWidth: contentWidth,
    lineHeight: 15
  })

  y -= 8
  page.drawText(`Weighted total: ${report.weighted_total}`, {
    x: pageMargin,
    y,
    font: fontBold,
    size: 11,
    color: rgb(0.1, 0.1, 0.1)
  })

  y -= 26
  page.drawText("Dimension scores", {
    x: pageMargin,
    y,
    font: fontBold,
    size: 14
  })
  y -= 18

  for (const [key, value] of Object.entries(report.scores || {})) {
    page.drawText(key.replace(/_/g, " "), {
      x: pageMargin,
      y,
      font: fontRegular,
      size: 11
    })
    page.drawText(`${value}/5`, {
      x: pageMargin + 240,
      y,
      font: fontBold,
      size: 11
    })
    y -= 16
  }

  y -= 14
  ;({ page, y } = ensureSpace(doc, { page, y }))
  page.drawText("Top issues", {
    x: pageMargin,
    y,
    font: fontBold,
    size: 14
  })
  y -= 18

  for (const issue of report.top_issues || []) {
    ;({ page, y } = ensureSpace(doc, { page, y }, 110))
    page.drawText(issue.dimension.replace(/_/g, " "), {
      x: pageMargin,
      y,
      font: fontBold,
      size: 11
    })
    y -= 15
    y = drawWrappedText(page, issue.issue, pageMargin, y, {
      font: fontRegular,
      size: 11,
      maxWidth: contentWidth,
      color: rgb(0.2, 0.2, 0.2)
    })
    y = drawWrappedText(page, issue.evidence, pageMargin, y, {
      font: fontRegular,
      size: 10,
      maxWidth: contentWidth,
      color: rgb(0.45, 0.35, 0.1)
    })
    y -= 8
  }

  ;({ page, y } = ensureSpace(doc, { page, y }, 120))
  page.drawText("Priority recommendations", {
    x: pageMargin,
    y,
    font: fontBold,
    size: 14
  })
  y -= 18

  for (const item of report.recommendations || []) {
    ;({ page, y } = ensureSpace(doc, { page, y }, 120))
    page.drawText(item.action, {
      x: pageMargin,
      y,
      font: fontBold,
      size: 11
    })
    y -= 15
    y = drawWrappedText(page, item.rationale, pageMargin, y, {
      font: fontRegular,
      size: 11,
      maxWidth: contentWidth,
      color: rgb(0.2, 0.2, 0.2)
    })
    y = drawWrappedText(page, `Example: ${item.example}`, pageMargin, y, {
      font: fontRegular,
      size: 10,
      maxWidth: contentWidth,
      color: rgb(0.1, 0.42, 0.22)
    })
    y -= 8
  }

  if (report.reviewer_notes) {
    ;({ page, y } = ensureSpace(doc, { page, y }, 110))
    page.drawText("Reviewer notes", {
      x: pageMargin,
      y,
      font: fontBold,
      size: 14
    })
    y -= 18
    y = drawWrappedText(page, report.reviewer_notes, pageMargin, y, {
      font: fontRegular,
      size: 11,
      maxWidth: contentWidth,
      color: rgb(0.2, 0.2, 0.2)
    })
  }

  return Buffer.from(await doc.save())
}


export async function buildRewriteDraftPdf({ rewriteDraft, order, intake, sessionId }) {
  const doc = await PDFDocument.create()
  const pageMargin = 50
  const pageWidth = 595
  const contentWidth = pageWidth - pageMargin * 2
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontSerif = await doc.embedFont(StandardFonts.TimesRomanBold)

  let page = doc.addPage([595, 842])
  let y = 770

  page.drawText("RunTime Resume", { x: pageMargin, y, font: fontBold, size: 12, color: rgb(0.75, 0.22, 0.17) })
  y -= 30
  page.drawText("Rewrite Draft", { x: pageMargin, y, font: fontSerif, size: 24, color: rgb(0.1, 0.1, 0.1) })
  y -= 24
  page.drawText(`Status: ${rewriteDraft.status || "draft"}`, { x: pageMargin, y, font: fontBold, size: 12, color: rgb(0.2, 0.2, 0.2) })
  y -= 20

  for (const line of [
    `Session: ${sessionId}`,
    `Email: ${order?.customer_email || "—"}`,
    `Target roles: ${intake?.target_roles || "—"}`,
    `Updated: ${rewriteDraft.updated_at ? new Date(rewriteDraft.updated_at).toLocaleString("en-AU") : "—"}`
  ]) {
    page.drawText(line, { x: pageMargin, y, font: fontRegular, size: 10, color: rgb(0.32, 0.32, 0.32) })
    y -= 14
  }

  y -= 10
  page.drawText("Summary", { x: pageMargin, y, font: fontBold, size: 14 })
  y -= 18
  y = drawWrappedText(page, rewriteDraft.rewrite?.summary || "—", pageMargin, y, {
    font: fontRegular,
    size: 11,
    maxWidth: contentWidth,
    color: rgb(0.2, 0.2, 0.2)
  })

  y -= 10
  ;({ page, y } = ensureSpace(doc, { page, y }, 120))
  page.drawText("Skills Section", { x: pageMargin, y, font: fontBold, size: 14 })
  y -= 18
  y = drawWrappedText(page, (rewriteDraft.rewrite?.skills_section || []).join(" · ") || "—", pageMargin, y, {
    font: fontRegular,
    size: 11,
    maxWidth: contentWidth,
    color: rgb(0.2, 0.2, 0.2)
  })

  for (const section of rewriteDraft.rewrite?.experience_sections || []) {
    ;({ page, y } = ensureSpace(doc, { page, y }, 140))
    y -= 10
    page.drawText(section.title || "Experience Section", { x: pageMargin, y, font: fontBold, size: 13 })
    y -= 18
    for (const bullet of section.bullets || []) {
      y = drawWrappedText(page, `• ${bullet}`, pageMargin, y, {
        font: fontRegular,
        size: 11,
        maxWidth: contentWidth,
        color: rgb(0.2, 0.2, 0.2)
      })
      y -= 4
      ;({ page, y } = ensureSpace(doc, { page, y }, 120))
    }
  }

  if ((rewriteDraft.rewrite?.rewrite_notes || []).length) {
    ;({ page, y } = ensureSpace(doc, { page, y }, 120))
    page.drawText("Rewrite Notes", { x: pageMargin, y, font: fontBold, size: 14 })
    y -= 18
    for (const note of rewriteDraft.rewrite.rewrite_notes) {
      y = drawWrappedText(page, `• ${note}`, pageMargin, y, {
        font: fontRegular,
        size: 11,
        maxWidth: contentWidth,
        color: rgb(0.2, 0.2, 0.2)
      })
      y -= 4
    }
  }

  return Buffer.from(await doc.save())
}
