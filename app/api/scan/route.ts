import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { target } = body

    if (!target) {
      return NextResponse.json({ detail: "Target URL is required" }, { status: 400 })
    }

    // Forward to Python backend with a timeout so it doesn't hang Next.js
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
        signal: controller.signal
      })

      clearTimeout(timeoutId);

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status })
      }

      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ detail: "Backend connection timed out. The scan might still be running." }, { status: 504 })
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Scan API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
