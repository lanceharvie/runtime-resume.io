"use client"

export default function ReportActions({ pdfHref }) {
  return (
    <div className="rr-cta-row" style={{ marginBottom: "1rem" }}>
      <button className="rr-btn-primary" type="button" onClick={() => window.print()}>
        Print / Save PDF
      </button>
      {pdfHref ? (
        <a className="rr-btn-ghost" href={pdfHref}>
          Download server PDF
        </a>
      ) : null}
    </div>
  )
}
