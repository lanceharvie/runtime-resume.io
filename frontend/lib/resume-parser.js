import { readFile } from "node:fs/promises"
import path from "node:path"
import mammoth from "mammoth"
import pdfParse from "pdf-parse"

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function parseResumeFile(filePath) {
  if (!filePath) {
    return { text: "", parser: "none" }
  }

  const ext = path.extname(filePath).toLowerCase()
  const buffer = await readFile(filePath)

  if (ext === ".pdf") {
    const parsed = await pdfParse(buffer)
    return { text: normalizeText(parsed.text), parser: "pdf-parse" }
  }

  if (ext === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer })
    return { text: normalizeText(parsed.value), parser: "mammoth" }
  }

  const text = buffer.toString("utf8")
  return { text: normalizeText(text), parser: "utf8" }
}
