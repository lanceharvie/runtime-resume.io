import { NextResponse } from "next/server"

const CV_GUIDE_PIPELINE_URL = process.env.CV_GUIDE_PIPELINE_URL || "http://127.0.0.1:8796"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://cv.runtimerec.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function POST() {
  try {
    const response = await fetch(`${CV_GUIDE_PIPELINE_URL}/api/cv-guide/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.detail || "Checkout failed" }, { status: response.status, headers: CORS_HEADERS })
    }
    return NextResponse.json(data, { headers: CORS_HEADERS })
  } catch (error) {
    return NextResponse.json({ error: "Checkout request failed" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
