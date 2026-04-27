"use client"

import { useMemo, useState } from "react"

function summarizeListDelta(currentList = [], previousList = []) {
  const current = Array.isArray(currentList) ? currentList : []
  const previous = Array.isArray(previousList) ? previousList : []
  const delta = current.length - previous.length

  if (delta > 0) return `+${delta}`
  if (delta < 0) return `${delta}`
  return "0"
}

function presetLabel(presets, presetId) {
  if (!presetId) return "—"
  const match = (presets || []).find((preset) => preset.id === presetId)
  return match?.label || presetId
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-AU")
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function uniqueOrdered(values = []) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const normalized = String(value || "").trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

function diffLines(currentLines = [], previousLines = []) {
  const previousSet = new Set(previousLines)
  const currentSet = new Set(currentLines)
  return {
    added: currentLines.filter((line) => !previousSet.has(line)),
    removed: previousLines.filter((line) => !currentSet.has(line))
  }
}

function sectionBulletsMap(sections = []) {
  const map = new Map()
  for (const section of sections) {
    const title = String(section?.title || "Untitled section").trim()
    const bullets = uniqueOrdered(Array.isArray(section?.bullets) ? section.bullets : [])
    map.set(title, bullets)
  }
  return map
}

function buildSectionDiff(currentSections = [], previousSections = []) {
  const currentMap = sectionBulletsMap(currentSections)
  const previousMap = sectionBulletsMap(previousSections)
  const titles = uniqueOrdered([...currentMap.keys(), ...previousMap.keys()])

  return titles
    .map((title) => {
      const currentBullets = currentMap.get(title) || []
      const previousBullets = previousMap.get(title) || []
      return {
        title,
        currentBullets,
        previousBullets,
        ...diffLines(currentBullets, previousBullets)
      }
    })
    .filter((section) => section.added.length || section.removed.length)
}

function buildDiff(current, previous) {
  if (!previous) {
    return ["Latest revision"]
  }

  const messages = []
  if ((current.status || "draft") !== (previous.status || "draft")) {
    messages.push(`Status: ${previous.status || "draft"} -> ${current.status || "draft"}`)
  }
  if ((current.preset_id || "") !== (previous.preset_id || "")) {
    messages.push("Preset changed")
  }
  if ((current.prompt_version || "") !== (previous.prompt_version || "")) {
    messages.push("Prompt version changed")
  }
  if ((current.rewrite?.summary || "") !== (previous.rewrite?.summary || "")) {
    messages.push("Summary changed")
  }
  if (JSON.stringify(current.rewrite?.skills_section || []) !== JSON.stringify(previous.rewrite?.skills_section || [])) {
    messages.push(`Skills items ${summarizeListDelta(current.rewrite?.skills_section, previous.rewrite?.skills_section)}`)
  }
  if (JSON.stringify(current.rewrite?.experience_sections || []) !== JSON.stringify(previous.rewrite?.experience_sections || [])) {
    const currentSections = current.rewrite?.experience_sections || []
    const previousSections = previous.rewrite?.experience_sections || []
    const currentBullets = currentSections.reduce((sum, section) => sum + (section?.bullets || []).length, 0)
    const previousBullets = previousSections.reduce((sum, section) => sum + (section?.bullets || []).length, 0)
    const bulletDelta = currentBullets - previousBullets
    messages.push(`Experience sections ${summarizeListDelta(currentSections, previousSections)} · bullets ${bulletDelta > 0 ? `+${bulletDelta}` : `${bulletDelta}`}`)
  }
  if (JSON.stringify(current.rewrite?.rewrite_notes || []) !== JSON.stringify(previous.rewrite?.rewrite_notes || [])) {
    messages.push(`Rewrite notes ${summarizeListDelta(current.rewrite?.rewrite_notes, previous.rewrite?.rewrite_notes)}`)
  }

  return messages.length ? messages : ["No material content change detected"]
}

function buildRestoreConfig(item, presets) {
  return [
    `Preset: ${presetLabel(presets, item.preset_id)}`,
    `Provider: ${item.llm_provider || "—"}`,
    `Model: ${item.llm_model || "—"}`,
    `Prompt: ${item.prompt_version || "—"}`
  ].join(" · ")
}

function summarizeRevision(item, presets) {
  return {
    id: item.id,
    updatedAt: formatDate(item.updated_at),
    status: item.status || "draft",
    preset: presetLabel(presets, item.preset_id),
    provider: item.llm_provider || "—",
    model: item.llm_model || "—",
    prompt: item.prompt_version || "—",
    summary: item.rewrite?.summary || "",
    skills: item.rewrite?.skills_section || [],
    notes: item.rewrite?.rewrite_notes || [],
    sections: item.rewrite?.experience_sections || []
  }
}

function revisionOptionLabel(item, presets) {
  return `#${item.id} · ${item.status || "draft"} · ${presetLabel(presets, item.preset_id)}`
}

function DiffBlock({ title, added = [], removed = [] }) {
  if (!added.length && !removed.length) return null

  return (
    <div className="rr-card" style={{ padding: "0.9rem" }}>
      <div className="rr-field-label">{title}</div>
      {added.length ? (
        <div style={{ marginTop: "0.5rem" }}>
          <p className="rr-note" style={{ color: "#7ee081" }}>Added</p>
          {added.map((line, index) => (
            <p key={`add-${index}`} className="rr-note" style={{ color: "#7ee081" }}>+ {line}</p>
          ))}
        </div>
      ) : null}
      {removed.length ? (
        <div style={{ marginTop: "0.5rem" }}>
          <p className="rr-note" style={{ color: "#ff9d90" }}>Removed</p>
          {removed.map((line, index) => (
            <p key={`remove-${index}`} className="rr-note" style={{ color: "#ff9d90" }}>- {line}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CompareTextCard({ title, leftTitle, rightTitle, leftValue, rightValue }) {
  if (!leftValue && !rightValue) return null

  return (
    <div className="rr-card" style={{ padding: "0.9rem" }}>
      <div className="rr-field-label">{title}</div>
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: "0.6rem" }}>
        <div>
          <p className="rr-note" style={{ color: "#f0c36a" }}>{leftTitle}</p>
          <p className="rr-note" style={{ whiteSpace: "pre-wrap" }}>{leftValue || "—"}</p>
        </div>
        <div>
          <p className="rr-note" style={{ color: "#9dc1ff" }}>{rightTitle}</p>
          <p className="rr-note" style={{ whiteSpace: "pre-wrap" }}>{rightValue || "—"}</p>
        </div>
      </div>
    </div>
  )
}

function CompareListCard({ title, leftTitle, rightTitle, leftItems = [], rightItems = [] }) {
  if (!leftItems.length && !rightItems.length) return null

  return (
    <div className="rr-card" style={{ padding: "0.9rem" }}>
      <div className="rr-field-label">{title}</div>
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: "0.6rem" }}>
        <div>
          <p className="rr-note" style={{ color: "#f0c36a" }}>{leftTitle}</p>
          {leftItems.length ? leftItems.map((item, index) => (
            <p key={`left-${title}-${index}`} className="rr-note">• {item}</p>
          )) : <p className="rr-note">—</p>}
        </div>
        <div>
          <p className="rr-note" style={{ color: "#9dc1ff" }}>{rightTitle}</p>
          {rightItems.length ? rightItems.map((item, index) => (
            <p key={`right-${title}-${index}`} className="rr-note">• {item}</p>
          )) : <p className="rr-note">—</p>}
        </div>
      </div>
    </div>
  )
}

export default function RewriteHistory({ history = [], presets = [] }) {
  const [restoringId, setRestoringId] = useState(null)
  const [error, setError] = useState("")
  const [leftId, setLeftId] = useState(history[0]?.id ? String(history[0].id) : "")
  const [rightId, setRightId] = useState(history[1]?.id ? String(history[1].id) : history[0]?.id ? String(history[0].id) : "")

  const items = useMemo(() => {
    return history.map((item, index) => ({
      ...item,
      diffMessages: buildDiff(item, history[index + 1] || null)
    }))
  }, [history])

  const compareState = useMemo(() => {
    const leftItem = items.find((item) => String(item.id) === leftId) || null
    const rightItem = items.find((item) => String(item.id) === rightId) || null
    if (!leftItem || !rightItem || leftItem.id === rightItem.id) return null

    const left = summarizeRevision(leftItem, presets)
    const right = summarizeRevision(rightItem, presets)
    return {
      left,
      right,
      diffMessages: buildDiff(leftItem, rightItem),
      summaryDiff: diffLines(splitLines(left.summary), splitLines(right.summary)),
      skillsDiff: diffLines(uniqueOrdered(left.skills), uniqueOrdered(right.skills)),
      notesDiff: diffLines(uniqueOrdered(left.notes), uniqueOrdered(right.notes)),
      sectionDiff: buildSectionDiff(left.sections, right.sections)
    }
  }, [items, leftId, rightId, presets])

  const handleRestore = async (id) => {
    setRestoringId(id)
    setError("")

    try {
      const response = await fetch("/api/rewrites/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to restore rewrite revision")
      window.location.reload()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Unable to restore rewrite revision")
      setRestoringId(null)
    }
  }

  if (!items.length) return null

  return (
    <div className="rr-card" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div className="rr-field-label">Rewrite history</div>

      {items.length > 1 ? (
        <div className="rr-card" style={{ padding: "1rem", marginTop: "0.75rem" }}>
          <div className="rr-field-label">Compare revisions</div>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div>
              <label className="rr-note" htmlFor="compare-left">Left revision</label>
              <select id="compare-left" className="rr-input" value={leftId} onChange={(event) => setLeftId(event.target.value)}>
                {items.map((item) => (
                  <option key={`left-${item.id}`} value={item.id}>{revisionOptionLabel(item, presets)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="rr-note" htmlFor="compare-right">Right revision</label>
              <select id="compare-right" className="rr-input" value={rightId} onChange={(event) => setRightId(event.target.value)}>
                {items.map((item) => (
                  <option key={`right-${item.id}`} value={item.id}>{revisionOptionLabel(item, presets)}</option>
                ))}
              </select>
            </div>
          </div>
          {compareState ? (
            <>
              <p className="rr-note" style={{ marginTop: "0.75rem" }}>{compareState.diffMessages.join(" | ")}</p>
              <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: "0.75rem" }}>
                {[compareState.left, compareState.right].map((side, index) => (
                  <div key={`${side.id}-${index}`} className="rr-card" style={{ padding: "0.9rem" }}>
                    <div className="rr-order-summary-row"><strong>Revision #{side.id}</strong><span>{side.updatedAt}</span></div>
                    <p className="rr-note">Status: {side.status}</p>
                    <p className="rr-note">Preset: {side.preset}</p>
                    <p className="rr-note">Provider: {side.provider}</p>
                    <p className="rr-note">Model: {side.model}</p>
                    <p className="rr-note">Prompt: {side.prompt}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
                <CompareTextCard
                  title="Summary"
                  leftTitle={`Revision #${compareState.left.id}`}
                  rightTitle={`Revision #${compareState.right.id}`}
                  leftValue={compareState.left.summary}
                  rightValue={compareState.right.summary}
                />
                <DiffBlock title="Summary diff" added={compareState.summaryDiff.added} removed={compareState.summaryDiff.removed} />
                <CompareListCard
                  title="Skills"
                  leftTitle={`Revision #${compareState.left.id}`}
                  rightTitle={`Revision #${compareState.right.id}`}
                  leftItems={compareState.left.skills}
                  rightItems={compareState.right.skills}
                />
                <DiffBlock title="Skills diff" added={compareState.skillsDiff.added} removed={compareState.skillsDiff.removed} />
                <CompareListCard
                  title="Rewrite notes"
                  leftTitle={`Revision #${compareState.left.id}`}
                  rightTitle={`Revision #${compareState.right.id}`}
                  leftItems={compareState.left.notes}
                  rightItems={compareState.right.notes}
                />
                <DiffBlock title="Rewrite notes diff" added={compareState.notesDiff.added} removed={compareState.notesDiff.removed} />
                {compareState.sectionDiff.map((section) => (
                  <div key={section.title} style={{ display: "grid", gap: "0.75rem" }}>
                    <CompareListCard
                      title={`Experience · ${section.title}`}
                      leftTitle={`Revision #${compareState.left.id}`}
                      rightTitle={`Revision #${compareState.right.id}`}
                      leftItems={section.currentBullets}
                      rightItems={section.previousBullets}
                    />
                    <DiffBlock title={`Experience diff · ${section.title}`} added={section.added} removed={section.removed} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="rr-note" style={{ marginTop: "0.75rem" }}>Select two different revisions to compare them.</p>
          )}
        </div>
      ) : null}

      {items.map((item, index) => {
        const isLatest = index === 0
        return (
          <div key={item.id} style={{ padding: "0.9rem 0", borderTop: index ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <div className="rr-order-summary-row">
              <span>Revision #{item.id} · {item.status}</span>
              <span>{formatDate(item.updated_at)}</span>
            </div>
            <p className="rr-note" style={{ marginTop: "0.35rem" }}>
              Preset: {presetLabel(presets, item.preset_id)} · Prompt: {item.prompt_version || "—"}
            </p>
            <p className="rr-note" style={{ marginTop: "0.45rem" }}>{item.diffMessages.join(" | ")}</p>
            {!isLatest ? (
              <>
                <p className="rr-note" style={{ marginTop: "0.45rem", color: "#f0c36a" }}>
                  Restore config: {buildRestoreConfig(item, presets)}
                </p>
                <div className="rr-cta-row" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                  <button className="rr-btn-ghost" type="button" onClick={() => handleRestore(item.id)} disabled={restoringId === item.id}>
                    {restoringId === item.id ? "Restoring..." : "Restore as current"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )
      })}
      {error ? <p className="rr-note" style={{ color: "#ff9d90", marginTop: "0.75rem" }}>{error}</p> : null}
    </div>
  )
}
