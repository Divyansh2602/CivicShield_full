"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Lock, AlertCircle } from "lucide-react"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function APISecurityContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const surfaceMap = scanData?.result?.surface_map || {}
  const findings = scanData?.result?.findings || []

  const apis = useMemo(() => {
    return Object.keys(surfaceMap)
      .filter((url) => url.toLowerCase().includes("api") || url.toLowerCase().includes("v1") || url.toLowerCase().includes("v2"))
      .map((url, i) => {
        const urlFindings = findings.filter((f: any) => f.url && f.url.startsWith(url))
        const risk = surfaceMap[url].risk

        let method = "GET"
        if (urlFindings.some((f: any) => f.payload?.includes("POST") || f.evidence?.includes("POST"))) {
          method = "POST"
        }

        return {
          id: i + 1,
          endpoint: url,
          method,
          requests: Math.floor(Math.random() * 800) + 120, // Traffic simulated as scanning is out-of-band
          jwt: risk !== "HIGH" && risk !== "CRITICAL",
          threat: urlFindings.length,
        }
      })
  }, [surfaceMap, findings])

  const totalThreats = apis.reduce((acc, curr) => acc + curr.threat, 0)
  const unprotectedCount = apis.filter(api => !api.jwt).length
  const totalRequests = apis.reduce((acc, curr) => acc + curr.requests, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">API Security Monitor</h1>

          {!scanId ? (
            <div className="glassmorphism rounded-lg p-6 mb-8 border border-warning/30 flex items-center gap-3">
              <p className="text-warning">No scan ID detected. Please start a scan from the home page to view API issues.</p>
            </div>
          ) : (
            <>
              {/* Metrics */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Total APIs</div>
                  <div className="text-3xl font-bold">{apis.length}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Protected (Estimated)</div>
                  <div className="text-3xl font-bold text-primary">{apis.length - unprotectedCount}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Unprotected / High Risk</div>
                  <div className="text-3xl font-bold text-critical">{unprotectedCount}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Detected Threats</div>
                  <div className="text-3xl font-bold text-warning">{totalThreats}</div>
                </div>
              </div>

              {/* APIs Table */}
              <div className="glassmorphism rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Traffic (Sim)</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Protection</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Threats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apis.map((api) => (
                        <tr key={api.id} className="border-b border-primary/5 hover:bg-primary/5 transition">
                          <td className="px-4 py-3 break-all">
                            <code className="text-xs bg-background/50 px-2 py-1 rounded">
                              {api.endpoint}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-bold ${api.method === "GET"
                                  ? "bg-primary/10 text-primary"
                                  : api.method === "POST"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-critical/10 text-critical"
                                }`}
                            >
                              {api.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{api.requests.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Lock className={`w-4 h-4 ${api.jwt ? "text-primary" : "text-foreground/40"}`} />
                              <span className={api.jwt ? "text-primary" : "text-critical"}>
                                {api.jwt ? "Protected" : "Vulnerable"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {api.threat > 0 && (
                                <AlertCircle className="w-4 h-4 text-critical" />
                              )}
                              <span className={api.threat > 0 ? "text-critical font-bold" : "text-foreground/60"}>
                                {api.threat}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {apis.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                            {scanData?.status === "completed" ? "No API endpoints detected in scan surface" : "Scanning in progress..."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function APISecurity() {
  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <APISecurityContent />
      </Suspense>
    </div>
  )
}
