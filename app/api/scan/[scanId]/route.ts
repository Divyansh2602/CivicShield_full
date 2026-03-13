import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const scanId = params.scanId

    // Forward to Python backend
    const response = await fetch(`${BACKEND_URL}/scan/${scanId}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache"
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Scan status API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
