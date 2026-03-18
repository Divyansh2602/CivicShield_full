"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Shield, Download, RefreshCw, AlertTriangle, AlertCircle, Gauge, Network, FileSearch, Radar } from "lucide-react"
import useSWR from "swr"
import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import RiskGaugeCard from "@/components/RiskGaugeCard"
import MetricCard from "@/components/MetricCard"
import VulnerabilityTable from "@/components/VulnerabilityTable"
import CyberAttackMap from "@/components/WorldMap"
import AIThreatInsights, { ThreatInsight } from "@/components/AIThreatInsights"
import { DashboardSkeleton } from "@/components/SkeletonLoader"
import toast from "react-hot-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  recon: "Reconnaissance",
  crawl: "Crawling",
  js_analysis: "JavaScript Analysis",
  surface_map: "Surface Mapping",
  param_discovery: "Parameter Discovery",
  vulnerability_scan: "Vulnerability Testing",
  idor_scan: "IDOR Checks",
  complete: "Completed",
  failed: "Failed",
}

const STAGE_THRESHOLDS: Record<string, number> = {
  recon: 15,
  crawl: 30,
  js_analysis: 45,
  surface_map: 55,
  param_discovery: 70,
  vulnerability_scan: 85,
  idor_scan: 93,
  complete: 100,
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scanId = searchParams.get("scanId")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: scanData, isLoading, error, mutate } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const completedResult = scanData?.status === "completed" ? scanData?.result : null
  const summary = useMemo(() => completedResult?.summary || scanData?.progress?.stats || {}, [completedResult, scanData?.progress?.stats])
  const findings = useMemo(() => completedResult?.findings || [], [completedResult])
  const progress = scanData?.progress || { stage: "queued", percent: 0, message: "Waiting for scan to start", stats: {} }
  const assessmentTitle = completedResult?.target ? "Current Assessment" : "Assessment Overview"

  const severityCounts = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 }
    findings.forEach((finding: any) => {
      const risk = String(finding.risk || "low").toLowerCase() as keyof typeof base
      base[risk] = (base[risk] || 0) + 1
    })
    return completedResult?.summary?.severity_counts || base
  }, [findings, completedResult])

  const vulnerabilityTypeCounts = useMemo(() => completedResult?.summary?.vulnerability_types || {}, [completedResult])

  const riskScore = useMemo(() => {
    if (!findings.length) return 0
    const total = findings.length
    const weighted = (severityCounts.critical * 5) + (severityCounts.high * 3) + (severityCounts.medium * 1)
    return Math.min(Math.round((weighted / (total * 5)) * 100), 100)
  }, [findings, severityCounts])

  const severityChartData = [
    { name: "Critical", value: severityCounts.critical || 0, fill: "#ff4d4f" },
    { name: "High", value: severityCounts.high || 0, fill: "#ffb020" },
    { name: "Medium", value: severityCounts.medium || 0, fill: "#00f5a0" },
    { name: "Low", value: severityCounts.low || 0, fill: "#5bc0eb" },
  ]

  const surfaceChartData = [
    { name: "Pages", value: summary.pages_crawled || 0 },
    { name: "Endpoints", value: summary.total_endpoints || 0 },
    { name: "Params", value: summary.parameters_discovered || 0 },
    { name: "Payloads", value: summary.payloads_tested || 0 },
  ]

  const insights: ThreatInsight[] = useMemo(() => {
    const items: ThreatInsight[] = []

    if ((severityCounts.critical || 0) > 0) {
      items.push({ type: "critical", message: `${severityCounts.critical} critical findings require immediate remediation before deployment.` })
    }
    if ((summary.high_risk_surface || 0) > 0) {
      items.push({ type: "warning", message: `${summary.high_risk_surface} high-risk endpoints were identified in the discovered attack surface.` })
    }
    if ((summary.passive_findings || 0) > 0) {
      items.push({ type: "info", message: `${summary.passive_findings} passive security observations were recorded from headers, transport posture, and exposed form surfaces.` })
    }
    if ((summary.payloads_tested || 0) > 0) {
      items.push({ type: "info", message: `${summary.payloads_tested} payload checks were executed across ${summary.urls_with_params || 0} parameterized endpoints.` })
    }
    if (Object.keys(vulnerabilityTypeCounts).length > 0) {
      const topType = Object.entries(vulnerabilityTypeCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
      if (topType) {
        items.push({ type: "warning", message: `${topType[0]} was the most frequently confirmed issue in this assessment.` })
      }
    }
    if (findings.length === 0 && scanData?.status === "completed") {
      items.push({ type: "success", message: "The automated scan completed without confirming exploitable findings on the tested endpoints." })
    }

    return items.slice(0, 4)
  }, [severityCounts, summary, vulnerabilityTypeCounts, findings.length, scanData?.status])

  const handleDownloadReport = async () => {
    if (!scanId) return
    const toastId = toast.loading("Generating report...", { style: { background: "#121826", color: "#00f5a0" } })
    try {
      const response = await fetch(`/api/report/${scanId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "assessment_report.pdf"
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
      toast.success("Scan data refreshed", {
        style: { background: "#121826", color: "#00f5a0", border: "1px solid rgba(0,245,160,0.3)" },
      })
    }, 500)
  }

  if (!scanId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Assessment Selected</h2>
          <p className="text-foreground/60 mb-6">Start a new scan from the home page to view results</p>
          <button onClick={() => router.push("/")} className="px-6 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto md:pt-0 pt-16">
      <DashboardHeader />
      <main className="p-6 md:p-8">
        <div className="mb-8">
          <div className="glassmorphism rounded-lg p-6 flex items-center justify-between gap-6 flex-col md:flex-row">
            <div>
              <h2 className="text-xl font-bold mb-2">{assessmentTitle}</h2>
              <p className="text-foreground/60">
                Status: <span className={`font-semibold ${scanData?.status === "completed" ? "text-primary" : scanData?.status === "failed" ? "text-critical" : "text-warning"}`}>
                  {scanData?.status?.toUpperCase()}
                </span>
              </p>
              <p className="text-sm text-foreground/50 mt-2 break-all">Target: {completedResult?.target || "Active assessment"}</p>
            </div>
            <div className="flex gap-4">
              {scanData?.status === "completed" && (
                <button onClick={handleDownloadReport} className="px-4 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              )}
              <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 border border-primary/30 text-primary rounded hover:bg-primary/10 flex items-center gap-2 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="glassmorphism rounded-lg p-6 mb-8 border border-primary/10">
          <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <p className="text-sm font-semibold text-foreground/60 mb-1">Current Stage</p>
              <h3 className="text-2xl font-bold">{STAGE_LABELS[progress.stage] || progress.stage}</h3>
              <p className="text-sm text-foreground/60 mt-2">{progress.message}</p>
            </div>
            <div className="w-full md:w-80">
              <div className="flex justify-between text-sm text-foreground/60 mb-2">
                <span>Pipeline Progress</span>
                <span>{progress.percent || 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-background/70 overflow-hidden border border-primary/10">
                <div className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500" style={{ width: `${progress.percent || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {isLoading && !scanData && <DashboardSkeleton />}

        {error && !scanData && (
          <div className="glassmorphism rounded-lg p-6 border border-critical/30 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-critical flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-critical mb-1">Assessment Failed</h3>
                <p className="text-foreground/60">{error.detail || "An error occurred during the scan"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Security Overview</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <RiskGaugeCard score={riskScore} />
            <MetricCard label="Critical Findings" value={severityCounts.critical || 0} color="critical" icon={<AlertCircle className="w-6 h-6" />} />
            <MetricCard label="Endpoints Discovered" value={summary.total_endpoints || 0} color="warning" icon={<Network className="w-6 h-6" />} />
            <MetricCard label="Payloads Tested" value={summary.payloads_tested || 0} color="warning" icon={<FileSearch className="w-6 h-6" />} />
          </div>
        </div>

        <div className="mb-8">
          <CyberAttackMap />
        </div>

        <AIThreatInsights insights={insights} />

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glassmorphism rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Scan Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-card/50 p-4 rounded border border-primary/10"><div className="text-foreground/60">Pages Crawled</div><div className="text-2xl font-bold">{summary.pages_crawled || 0}</div></div>
              <div className="bg-card/50 p-4 rounded border border-primary/10"><div className="text-foreground/60">JS Endpoints</div><div className="text-2xl font-bold">{summary.js_endpoints || 0}</div></div>
              <div className="bg-card/50 p-4 rounded border border-primary/10"><div className="text-foreground/60">Parameters Found</div><div className="text-2xl font-bold">{summary.parameters_discovered || 0}</div></div>
              <div className="bg-card/50 p-4 rounded border border-primary/10"><div className="text-foreground/60">Confirmed Findings</div><div className="text-2xl font-bold">{summary.confirmed_findings || findings.length || 0}</div></div>
            </div>

            <div className="mt-6 space-y-3">
              {Object.entries(STAGE_LABELS)
                .filter(([key]) => !["queued", "failed"].includes(key))
                .map(([key, label]) => {
                  const completed = (progress.percent || 0) >= (STAGE_THRESHOLDS[key] || 0)
                  const active = progress.stage === key
                  return (
                    <div key={key} className={`flex items-center justify-between p-3 rounded border ${active ? "border-primary/40 bg-primary/5" : "border-primary/10 bg-card/40"}`}>
                      <span className="text-sm font-medium">{label}</span>
                      <span className={`text-xs font-semibold ${completed ? "text-primary" : "text-foreground/50"}`}>{completed ? "Done" : active ? "Active" : "Pending"}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="glassmorphism rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Severity Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={severityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 245, 160, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(224, 224, 224, 0.5)" />
                <YAxis stroke="rgba(224, 224, 224, 0.5)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(18, 24, 38, 0.8)", border: "1px solid rgba(0, 245, 160, 0.3)", borderRadius: "8px" }} />
                <Bar dataKey="value">
                  {severityChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-1 gap-6 mb-8">
          <div className="glassmorphism rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Assessment Footprint</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={surfaceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 245, 160, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(224, 224, 224, 0.5)" />
                <YAxis stroke="rgba(224, 224, 224, 0.5)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(18, 24, 38, 0.8)", border: "1px solid rgba(0, 245, 160, 0.3)", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glassmorphism rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold mb-4">Detected Findings</h3>
          <VulnerabilityTable vulnerabilities={findings} />
        </div>
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
