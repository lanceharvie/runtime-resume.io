import { NextResponse } from "next/server"
import { createAdminUnauthorizedJsonResponse, hasAdminAccessRequest } from "@/lib/access"
import { markOrderDelivered } from "@/lib/order-store"

export async function POST(request) {
  if (!hasAdminAccessRequest(request)) {
    return createAdminUnauthorizedJsonResponse()
  }
  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : ""
  const deliveryChannel = typeof body?.delivery_channel === "string" ? body.delivery_channel.trim() : "manual"
  const deliveryNotes = typeof body?.delivery_notes === "string" ? body.delivery_notes : ""

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const order = await markOrderDelivered(sessionId, {
    delivery_channel: deliveryChannel || "manual",
    delivery_notes: deliveryNotes
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, order })
}
