"use client"

import Link from "next/link"
import BackButton from "@/components/back-button"

const links = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
]

export default function SiteHeader() {
  return (
    <header className="rr-nav">
      <div className="rr-container rr-nav-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <Link href="/" className="rr-logo">
            Runtime <span>Resume</span>
          </Link>
        </div>
        <nav className="rr-nav-links">
          <BackButton fallbackHref="/" label="Back" />
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/order" className="rr-btn-primary">
            Get Reviewed
          </Link>
        </nav>
      </div>
    </header>
  )
}
