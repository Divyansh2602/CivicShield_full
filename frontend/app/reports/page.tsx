"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Download, FileText, Calendar, ShieldCheck } from "lucide-react"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ReportsContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const handleDownload = (id: string) => {
    window.open(`/api/report/${id}`, "_blank")
  }

  const summary = scanData?.result?.summary || {}

  const reports = useMemo(() => {
    if (!scanId || !scanData?.result) return []
    const findings = scanData.result.findings || []
    const target = scanData.result.target || "Current Target"

    return [
      {
        id: scanId,
        name: `${target} Security Report`,
        date: new Date().toISOString().split("T")[0],
        vulnerabilities: findings.length,
        critical: findings.filter((f: any) => f.risk === "CRITICAL").length,
        high: findings.filter((f: any) => f.risk === "HIGH").length,
        status: scanData.status === "completed" ? "Completed" : "In Progress",
      },
    ]
  }, [scanData, scanId])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Security Reports</h1>

          {!scanId ? (
            <div className="glassmorphism rounded-lg p-6 mb-8 border border-warning/30 flex items-center gap-3">
              <p className="text-warning">No active assessment context. Please start a scan from the home page to view and generate reports.</p>
            </div>
          ) : (
            <>
              <div className="glassmorphism rounded-lg p-6 mb-8">
                <h2 className="text-lg font-bold mb-4">Generate Report For Current Assessment</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-card/50 rounded-lg border border-primary/10">
                    <p className="text-sm font-semibold mb-2">Target URL</p>
                    <p className="font-mono text-primary break-all">{scanData?.result?.target || "Loading..."}</p>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-card/50 rounded-lg border border-primary/10 p-4"><div className="text-sm text-foreground/60">Findings</div><div className="text-2xl font-bold">{summary.confirmed_findings || 0}</div></div>
                    <div className="bg-card/50 rounded-lg border border-primary/10 p-4"><div className="text-sm text-foreground/60">Critical</div><div className="text-2xl font-bold text-critical">{summary.severity_counts?.critical || 0}</div></div>
                    <div className="bg-card/50 rounded-lg border border-primary/10 p-4"><div className="text-sm text-foreground/60">Endpoints</div><div className="text-2xl font-bold">{summary.total_endpoints || 0}</div></div>
                    <div className="bg-card/50 rounded-lg border border-primary/10 p-4"><div className="text-sm text-foreground/60">Payloads</div><div className="text-2xl font-bold">{summary.payloads_tested || 0}</div></div>
                  </div>

                  <div className="p-4 rounded-lg border border-primary/10 bg-primary/5 text-sm text-foreground/80 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>The generated PDF includes executive summary metrics, detailed findings, and recommended remediation guidance for each issue.</p>
                  </div>

                  <button
                    onClick={() => handleDownload(scanId)}
                    disabled={scanData?.status !== "completed"}
                    className="w-full px-6 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {scanData?.status !== "completed" ? "Assessment In Progress..." : "Download PDF Report"}
                  </button>
                  {scanData?.status !== "completed" && (
                    <p className="text-xs text-center text-foreground/50 mt-2">Reports can only be downloaded once the scan is completed.</p>
                  )}
                </div>
              </div>

              <div className="glassmorphism rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-primary/10 rounded-lg p-4 hover:bg-primary/5 transition flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold">{report.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-foreground/60 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {report.date}
                            </div>
                            <span>{report.vulnerabilities} findings recorded</span>
                            <div className="flex gap-2">
                              {report.critical > 0 && <span className="px-2 py-0.5 bg-critical/10 text-critical rounded text-xs">{report.critical} Critical</span>}
                              {report.high > 0 && <span className="px-2 py-0.5 bg-warning/10 text-warning rounded text-xs">{report.high} High</span>}
                              <span className={`px-2 py-0.5 rounded text-xs ${report.status === "Completed" ? "bg-success/10 text-success text-primary" : "bg-warning/10 text-warning"}`}>{report.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(report.id)} disabled={report.status !== "Completed"} className="px-4 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition flex items-center gap-2 disabled:opacity-50">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                  {reports.length === 0 && <div className="p-4 text-center text-foreground/50 border border-dashed border-primary/20 rounded-lg">No reports available yet.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function Reports() {
  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
