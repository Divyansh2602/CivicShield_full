import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

// Used by the landing page to wake the Render backend early (it can cold-start
// after sleeping), so it's warm by the time the user starts a scan.
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/healthz`, {
      method: "GET",
      cache: "no-store",
    })
    return NextResponse.json({ ok: res.ok, status: res.status })
  } catch {
    // A failed ping still served its purpose (it triggered the wake); report not-ready.
    return NextResponse.json({ ok: false, status: 0 })
  }
}
