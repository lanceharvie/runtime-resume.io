import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="rr-footer">
      <div className="rr-container rr-footer-inner">
        <div>RunTime Resume is operated by RunTime Recruitment.</div>
        <div className="flex gap-4">
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
