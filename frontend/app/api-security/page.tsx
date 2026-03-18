"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Lock, AlertCircle, Shield, Activity } from "lucide-react"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function APISecurityContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const apis = useMemo(() => {
    const surfaceMap = scanData?.result?.surface_map || {}
    const findings = scanData?.result?.findings || []

    return Object.keys(surfaceMap)
      .filter((url) => url.toLowerCase().includes("api") || url.toLowerCase().includes("v1") || url.toLowerCase().includes("v2"))
      .map((url, i) => {
        const urlFindings = findings.filter((f: any) => f.url && f.url.startsWith(url))
        const risk = surfaceMap[url].risk
        const methodSet = new Set(urlFindings.map((f: any) => f.method).filter(Boolean))
        const method = methodSet.size > 0 ? Array.from(methodSet).join(", ") : "GET"

        return {
          id: i + 1,
          endpoint: url,
          method,
          assessmentBasis: risk === "HIGH" || risk === "CRITICAL" ? "Surface risk keyword match" : "No auth weakness inferred from scan",
          jwt: risk !== "HIGH" && risk !== "CRITICAL",
          threat: urlFindings.length,
          risk,
        }
      })
  }, [scanData])

  const totalThreats = apis.reduce((acc, curr) => acc + curr.threat, 0)
  const unprotectedCount = apis.filter((api) => !api.jwt).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-3">API Security Monitor</h1>
          <p className="text-foreground/60 mb-8">This view is derived from the current scan surface and confirmed findings. It is not live traffic telemetry.</p>

          {!scanId ? (
            <div className="glassmorphism rounded-lg p-6 mb-8 border border-warning/30 flex items-center gap-3">
              <p className="text-warning">No scan ID detected. Please start a scan from the home page to view API issues.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Detected APIs</div>
                  <div className="text-3xl font-bold">{apis.length}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Lower Risk APIs</div>
                  <div className="text-3xl font-bold text-primary">{apis.length - unprotectedCount}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">High-Risk / Review</div>
                  <div className="text-3xl font-bold text-critical">{unprotectedCount}</div>
                </div>
                <div className="glassmorphism rounded-lg p-6">
                  <div className="text-sm text-foreground/60 font-semibold mb-2">Confirmed API Findings</div>
                  <div className="text-3xl font-bold text-warning">{totalThreats}</div>
                </div>
              </div>

              <div className="glassmorphism rounded-lg p-6 mb-8 border border-primary/10 bg-primary/5 text-sm text-foreground/80 flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p>Protection status is an assessment derived from endpoint naming and scan findings. It should be described as estimated API exposure during the demo, not verified JWT enforcement.</p>
              </div>

              <div className="glassmorphism rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Risk Basis</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Assessment</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apis.map((api) => (
                        <tr key={api.id} className="border-b border-primary/5 hover:bg-primary/5 transition">
                          <td className="px-4 py-3 break-all"><code className="text-xs bg-background/50 px-2 py-1 rounded">{api.endpoint}</code></td>
                          <td className="px-4 py-3"><span className="inline-block px-2 py-1 rounded text-xs font-bold bg-primary/10 text-primary">{api.method}</span></td>
                          <td className="px-4 py-3 text-foreground/70">{api.assessmentBasis}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Lock className={`w-4 h-4 ${api.jwt ? "text-primary" : "text-foreground/40"}`} />
                              <span className={api.jwt ? "text-primary" : "text-critical"}>{api.jwt ? "Lower Risk" : "Needs Review"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {api.threat > 0 && <AlertCircle className="w-4 h-4 text-critical" />}
                              <span className={api.threat > 0 ? "text-critical font-bold" : "text-foreground/60"}>{api.threat}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {apis.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">{scanData?.status === "completed" ? "No API endpoints were inferred from the current scan surface." : "Scanning in progress..."}</td>
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
