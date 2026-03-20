import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const SCAN_START_TIMEOUT_MS = 55000

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { target } = body

    if (!target) {
      return NextResponse.json({ detail: "Target URL is required" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SCAN_START_TIMEOUT_MS)

    try {
      const response = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status })
      }

      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { detail: "Backend took too long to acknowledge the scan request. Render may still be waking up; wait a few seconds and retry." },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error("Scan API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
