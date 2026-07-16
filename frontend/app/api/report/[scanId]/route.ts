import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export const dynamic = 'force-dynamic'
export const revalidate = 0
// The backend runs on a free tier that cold-starts (~50s) after idle. Give the
// proxy real headroom to wait out a wake-up instead of the platform killing it
// at the short default timeout — that timeout was surfacing to users as
// "report can't be downloaded" whenever the backend had spun down.
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  const scanId = params.scanId

  try {
    // Wait up to ~55s for a cold backend to wake and stream the PDF.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55_000)
    let response: Response
    try {
      response = await fetch(`${BACKEND_URL}/report/${scanId}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      // Pass the backend's real reason through; tolerate non-JSON error bodies.
      let detail = `Report request failed (status ${response.status})`
      try {
        const data = await response.json()
        detail = data?.detail || detail
      } catch {
        /* non-JSON error body — keep the generic detail */
      }
      return NextResponse.json({ detail }, { status: response.status })
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
    // Network error or wake-up timeout — signal "retryable" so the client waits.
    console.error("Report proxy error:", error)
    return NextResponse.json(
      {
        detail:
          "Could not reach the scanner backend (it may be waking up). Please retry in a moment.",
      },
      { status: 503 }
    )
  }
}
