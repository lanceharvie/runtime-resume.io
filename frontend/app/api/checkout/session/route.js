import { NextResponse } from "next/server"
import { getOrderBySessionId } from "@/lib/order-store"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 })
    }

    const order = await getOrderBySessionId(sessionId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: order.session_id,
      status: order.checkout_status,
      payment_status: order.payment_status,
      customer_email: order.customer_email || "",
      metadata: {
        tier: order.tier,
        tier_name: order.tier_name,
        addons: order.addons || []
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load order" },
      { status: 500 }
    )
  }
}
