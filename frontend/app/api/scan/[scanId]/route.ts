import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const SCAN_STATUS_TIMEOUT_MS = 25000

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const scanId = params.scanId
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SCAN_STATUS_TIMEOUT_MS)

    try {
      const response = await fetch(`${BACKEND_URL}/scan/${scanId}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
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
          { detail: "Backend status check is still waiting on Render. The dashboard will keep retrying." },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error("Scan status API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
