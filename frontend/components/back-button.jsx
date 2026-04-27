"use client"

import { useRouter } from "next/navigation"

export default function BackButton({ fallbackHref = "/", label = "Back" }) {
  const router = useRouter()

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallbackHref)
  }

  return (
    <button type="button" className="rr-btn-ghost" onClick={handleClick}>
      ← {label}
    </button>
  )
}
