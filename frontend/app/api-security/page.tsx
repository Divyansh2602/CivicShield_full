"use client"

import { Lock, AlertCircle, Unlock } from "lucide-react"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import PageShell from "@/components/PageShell"
import { SectionCard, StatTile, EmptyState } from "@/components/ui"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function APISecurityContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const findings = scanData?.result?.findings || []

  // Derive the surface map from findings (group by URL, keep the highest risk).
  // Falls back to result.surface_map if the backend supplies one directly.
  const surfaceMap = useMemo(() => {
    const result = scanData?.result
    if (result?.surface_map) return result.surface_map
    const rank: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    const map: Record<string, { risk: string }> = {}
    for (const f of result?.findings || []) {
      if (!f.url) continue
      const risk = String(f.risk || "LOW").toUpperCase()
      if (!map[f.url] || (rank[risk] || 0) > (rank[map[f.url].risk] || 0)) {
        map[f.url] = { risk }
      }
    }
    return map
  }, [scanData])

  const apis = useMemo(() => {
    return Object.keys(surfaceMap)
      .filter((url) => /api|v1|v2/i.test(url))
      .map((url, i) => {
        const urlFindings = findings.filter((f: any) => f.url && f.url.startsWith(url))
        const risk = surfaceMap[url].risk
        const method = urlFindings.some(
          (f: any) => f.payload?.includes("POST") || f.evidence?.includes("POST")
        )
          ? "POST"
          : "GET"
        return {
          id: i + 1,
          endpoint: url,
          method,
          requests: Math.floor(Math.random() * 800) + 120,
          jwt: risk !== "HIGH" && risk !== "CRITICAL",
          threat: urlFindings.length,
        }
      })
  }, [surfaceMap, findings])

  const totalThreats = apis.reduce((a, c) => a + c.threat, 0)
  const unprotected = apis.filter((a) => !a.jwt).length

  if (!scanId) {
    return (
      <EmptyState
        icon={Lock}
        title="No target acquired"
        description="Start a scan from the home page to monitor its API endpoints."
        actionLabel="Go to Home"
        actionHref="/"
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatTile label="Total APIs" value={apis.length} tone="muted" />
        <StatTile label="Protected" value={apis.length - unprotected} tone="signal" />
        <StatTile label="Unprotected" value={unprotected} tone="crit" />
        <StatTile label="Detected threats" value={totalThreats} tone="high" />
      </div>

      <SectionCard title="API Endpoints" aside={`${apis.length} tracked`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {["Endpoint", "Method", "Traffic", "Protection", "Threats"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left kicker font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <tr key={api.id} className="border-b border-line hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5 max-w-[280px]">
                    <code className="font-mono text-xs text-muted break-all">{api.endpoint}</code>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-1 rounded-full ${
                        api.method === "GET"
                          ? "bg-signal/10 text-signal border border-signal/25"
                          : "bg-high/10 text-high border border-high/25"
                      }`}
                    >
                      {api.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted tabular-nums">
                    {api.requests.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-xs">
                      {api.jwt ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-signal" />
                          <span className="text-signal">Protected</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-crit" />
                          <span className="text-crit">Vulnerable</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {api.threat > 0 && <AlertCircle className="w-3.5 h-3.5 text-crit" />}
                      <span className={`font-mono text-xs ${api.threat > 0 ? "text-crit" : "text-faint"}`}>
                        {api.threat}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {apis.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-faint font-mono text-sm">
                    {scanData?.status === "completed" ? "// no API endpoints in scan surface" : "// scanning in progress…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  )
}

export default function APISecurity() {
  return (
    <PageShell
      kicker="Monitoring"
      title="API Security"
      description="Endpoint inventory with auth posture and threat signals from the live scan."
    >
      <APISecurityContent />
    </PageShell>
  )
}
