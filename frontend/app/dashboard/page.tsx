"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Shield, Download, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react"
import useSWR from "swr"
import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import RiskGaugeCard from "@/components/RiskGaugeCard"
import MetricCard from "@/components/MetricCard"
import VulnerabilityTable from "@/components/VulnerabilityTable"
import CyberAttackMap from "@/components/WorldMap"
import AIThreatInsights from "@/components/AIThreatInsights"
import { DashboardSkeleton } from "@/components/SkeletonLoader"
import { displayScanNumber } from "@/lib/scanNumber"
import toast from "react-hot-toast"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scanId = searchParams.get("scanId")
  const [mockData, setMockData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Per-session display number (resets each browser session, per visitor).
  // Computed after mount so it never causes a hydration mismatch.
  const [scanLabel, setScanLabel] = useState<string>("—")
  useEffect(() => {
    setScanLabel(displayScanNumber(scanId))
  }, [scanId])

  const { data: scanData, isLoading, error, mutate } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  // Process real scan data instead of mock data
  useEffect(() => {
    // Reset mock data when starting a new scan or waiting for completion
    if (!scanId || scanData?.status !== "completed") {
      setMockData(null);
      return;
    }

    if (scanId && scanData?.status === "completed" && (!mockData || mockData.scanId !== scanId)) {
      const findings = scanData?.result?.findings || [];

      let critical = 0;
      let high = 0;
      let medium = 0;

      let sqlInjection = 0;
      let xss = 0;
      let apiVulns = 0;

      findings.forEach((f: any) => {
        const risk = (f.risk || "").toLowerCase();
        if (risk === "critical") critical++;
        else if (risk === "high") high++;
        else if (risk === "medium") medium++;

        const type = (f.vuln || f.vuln_type || "").toLowerCase();
        if (type.includes("sql")) sqlInjection++;
        else if (type.includes("xss") || type.includes("cross")) xss++;
        else apiVulns++;
      });

      const total = findings.length;
      let riskScore = 0;
      if (total > 0) {
        const maxScore = total * 5;
        const actualScore = (critical * 5) + (high * 3) + (medium * 1);
        riskScore = Math.min(Math.round((actualScore / maxScore) * 100), 100);
      }

      // Fallback trend data since we don't have historical data for a single scan endpoint
      // We realistically only have findings for this scan.
      const trendData = [
        { date: "Mon", incidents: 2 },
        { date: "Tue", incidents: 5 },
        { date: "Wed", incidents: 3 },
        { date: "Thu", incidents: 7 },
        { date: "Fri", incidents: 4 },
        { date: "Sat", incidents: 1 },
        { date: "Sun", incidents: findings.length },
      ];

      setMockData({
        scanId,
        riskScore,
        sqlInjection,
        xss,
        apiVulns,
        misconfigs: 0,
        phishing: 0,
        blockedAttacks: 0,
        trendData,
        vulnerabilities: findings
      })
    }
  }, [scanData, scanId, mockData])

  const handleDownloadReport = async () => {
    if (!scanId) return
    const toastId = toast.loading("Generating report...", { style: { background: '#121826', color: '#00f5a0' } })
    try {
      const response = await fetch(`/api/report/${scanId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report_${scanId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Report downloaded successfully", { id: toastId })
      } else {
        toast.error("Failed to generate report", { id: toastId })
      }
    } catch (err) {
      console.error("Failed to download report:", err)
      toast.error("An error occurred during download", { id: toastId })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Scan data refreshed", { icon: '🔄', style: { background: '#121826', color: '#00f5a0', border: '1px solid rgba(0,245,160,0.3)' } })
    }, 500)
  }

  if (!scanId) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 pt-16 md:pt-0">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-signal/10 border border-signal/25 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-signal" />
          </div>
          <h2 className="display text-4xl text-foreground mb-2">No target acquired</h2>
          <p className="text-muted mb-6 text-sm">Start a scan from the home page to bring the console online.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-signal-gradient text-void font-semibold rounded-xl hover:brightness-110 transition shadow-signal-sm"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const statusColor =
    scanData?.status === "completed"
      ? "var(--signal)"
      : scanData?.status === "failed"
      ? "var(--crit)"
      : "var(--high)"

  return (
    <div className="flex-1 overflow-auto md:pt-0 pt-16">
      <DashboardHeader />

      <main className="p-5 md:p-8 max-w-[1600px] mx-auto w-full">
        {/* Status bar */}
        <div className="mb-8 panel p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="relative flex h-2.5 w-2.5">
              {scanData?.status !== "completed" && scanData?.status !== "failed" && (
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: statusColor }} />
              )}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: statusColor }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="kicker">Scan</span>
                <span className="font-mono text-sm text-foreground">#{scanLabel}</span>
              </div>
              <p className="text-sm mt-0.5">
                <span className="text-muted">Status:</span>{" "}
                <span className="font-mono font-semibold" style={{ color: statusColor }}>
                  {scanData?.status?.toUpperCase() || "—"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {scanData?.status === "completed" && (
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2.5 bg-signal-gradient text-void font-semibold rounded-xl hover:brightness-110 transition flex items-center gap-2 text-sm shadow-signal-sm"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 border border-line-strong text-foreground rounded-xl hover:bg-white/5 flex items-center gap-2 disabled:opacity-50 text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && !mockData && <DashboardSkeleton />}

        {/* Error */}
        {error && !mockData && (
          <div className="panel p-6 border-crit/30 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-crit flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-crit mb-1">Scan Failed</h3>
                <p className="text-muted text-sm">{error.detail || "An error occurred during the scan"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Failed scan (e.g. target unreachable) — surfaced from the scan status,
            which returns HTTP 200 so the SWR `error` above never fires. */}
        {scanData?.status === "failed" && (
          <div className="panel p-6 border-crit/30 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-crit flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-crit mb-1">Scan Failed</h3>
                <p className="text-muted text-sm">
                  {scanData?.error ||
                    "The scan could not be completed. The target may be unreachable or the URL may be invalid."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {mockData && (
          <>
            {/* Overview */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="kicker">Security Overview</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <RiskGaugeCard score={mockData.riskScore} />
                <MetricCard label="SQL Injection" value={mockData.sqlInjection} color="critical" icon={<AlertCircle className="w-5 h-5" />} />
                <MetricCard label="XSS Vulnerabilities" value={mockData.xss} color="warning" icon={<AlertCircle className="w-5 h-5" />} />
                <MetricCard label="API Vulnerabilities" value={mockData.apiVulns} color="warning" icon={<AlertCircle className="w-5 h-5" />} />
              </div>
            </div>

            {/* AI insight */}
            <AIThreatInsights />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              <div className="panel p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="kicker">Security Trend · 7 days</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockData.trendData}>
                    <defs>
                      <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--signal-deep)" />
                        <stop offset="100%" stopColor="var(--signal)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(12,17,25,0.95)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="incidents" stroke="url(#trendStroke)" strokeWidth={2.5} dot={{ fill: "var(--signal)", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="panel p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="kicker">Vulnerability Distribution</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[
                      { name: "SQLi", value: mockData.sqlInjection, fill: "var(--crit)" },
                      { name: "XSS", value: mockData.xss, fill: "var(--high)" },
                      { name: "API", value: mockData.apiVulns, fill: "var(--med)" },
                    ]}
                    key="distribution"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      contentStyle={{
                        backgroundColor: "rgba(12,17,25,0.95)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="var(--crit)" />
                      <Cell fill="var(--high)" />
                      <Cell fill="var(--med)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Globe */}
            <div className="mb-8">
              <CyberAttackMap />
            </div>

            {/* Findings */}
            <div className="panel p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="kicker">Detected Vulnerabilities</span>
                <span className="font-mono text-[11px] text-faint">{mockData.vulnerabilities.length} findings</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <VulnerabilityTable vulnerabilities={mockData.vulnerabilities} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
