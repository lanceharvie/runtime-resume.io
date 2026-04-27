import { NextResponse } from "next/server"
import { canSendEmail, sendIntakeReminderEmail } from "@/lib/email"
import { listOrdersNeedingIntakeReminder, markIntakeReminderSent } from "@/lib/order-store"

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const hoursSincePaid = Number(body?.hours_since_paid || 2)

  if (!canSendEmail()) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 400 })
  }

  const candidates = await listOrdersNeedingIntakeReminder(hoursSincePaid, 50)
  let sent = 0
  let failed = 0

  for (const order of candidates) {
    try {
      await sendIntakeReminderEmail(order)
      await markIntakeReminderSent(order.session_id)
      sent += 1
    } catch {
      failed += 1
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    failed
  })
}
