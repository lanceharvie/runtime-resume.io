import { NextResponse } from "next/server"
import { getOrderBySessionId } from "@/lib/order-store"

export async function GET(_request, context) {
  const params = await context.params
  const sessionId = params?.sessionId

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const order = await getOrderBySessionId(sessionId)
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  return NextResponse.json(order)
}
