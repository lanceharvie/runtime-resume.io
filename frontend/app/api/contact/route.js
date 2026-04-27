import { NextResponse } from "next/server"
import { createContactInquiry } from "@/lib/contact-store"
import { canSendEmail, sendContactInquiryNotification } from "@/lib/email"

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim()
  const linkedin_url = String(body?.linkedin_url || "").trim()
  const target_role = String(body?.target_role || "").trim()
  const geography = String(body?.geography || "").trim()
  const fit_question = String(body?.fit_question || "").trim()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }
  if (!fit_question) {
    return NextResponse.json({ error: "Fit question is required" }, { status: 400 })
  }
  if (fit_question.length > 3000) {
    return NextResponse.json({ error: "Fit question is too long" }, { status: 400 })
  }

  const inquiry = await createContactInquiry({
    name,
    email,
    linkedin_url,
    target_role,
    geography,
    fit_question
  })

  if (canSendEmail()) {
    try {
      await sendContactInquiryNotification(inquiry)
    } catch (error) {
      console.error("Failed to send contact enquiry notification", error)
    }
  }

  return NextResponse.json({ ok: true, inquiry })
}
