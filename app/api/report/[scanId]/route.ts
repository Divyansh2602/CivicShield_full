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
    const response = await fetch(`${BACKEND_URL}/report/${scanId}`, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report_${scanId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Report API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
