import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const REPORT_TIMEOUT_MS = 55000

export const dynamic = "force-dynamic"
export const revalidate = 0
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const scanId = params.scanId
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS)

    try {
      const response = await fetch(`${BACKEND_URL}/report/${scanId}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { detail: "Report generation is taking longer than expected. Render may still be warming up; retry the download shortly." },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error("Report API error:", error)
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    )
  }
}
