"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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
import toast from "react-hot-toast"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const scanId = searchParams.get("scanId")
  const [mockData, setMockData] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Scan Selected</h2>
          <p className="text-foreground/60 mb-6">Start a new scan from the home page to view results</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90"
          >
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
        {/* Status Section */}
        <div className="mb-8">
          <div className="glassmorphism rounded-lg p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Scan #{scanId}</h2>
              <p className="text-foreground/60">
                Status: <span className={`font-semibold ${scanData?.status === "completed" ? "text-primary" : "text-warning"}`}>
                  {scanData?.status?.toUpperCase()}
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              {scanData?.status === "completed" && (
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 border border-primary/30 text-primary rounded hover:bg-primary/10 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !mockData && (
          <DashboardSkeleton />
        )}

        {/* Error State */}
        {error && !mockData && (
          <div className="glassmorphism rounded-lg p-6 border border-critical/30 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-critical flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-critical mb-1">Scan Failed</h3>
                <p className="text-foreground/60">{error.detail || "An error occurred during the scan"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {mockData && (
          <>
            {/* Risk Score Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Security Overview</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <RiskGaugeCard score={mockData.riskScore} />
                <MetricCard
                  label="SQL Injection"
                  value={mockData.sqlInjection}
                  color="critical"
                  icon={<AlertCircle className="w-6 h-6" />}
                />
                <MetricCard
                  label="XSS Vulnerabilities"
                  value={mockData.xss}
                  color="warning"
                  icon={<AlertCircle className="w-6 h-6" />}
                />
                <MetricCard
                  label="API Vulnerabilities"
                  value={mockData.apiVulns}
                  color="warning"
                  icon={<AlertCircle className="w-6 h-6" />}
                />
              </div>
            </div>

            {/* AI Threat Insight Panel */}
            <AIThreatInsights />

            {/* Trends and Distribution */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="glassmorphism rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Security Trends (7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 245, 160, 0.1)" />
                    <XAxis stroke="rgba(224, 224, 224, 0.5)" />
                    <YAxis stroke="rgba(224, 224, 224, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(18, 24, 38, 0.8)",
                        border: "1px solid rgba(0, 245, 160, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="incidents"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glassmorphism rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Vulnerability Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Critical", value: mockData.sqlInjection },
                    { name: "High", value: mockData.xss },
                    { name: "Medium", value: mockData.apiVulns },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 245, 160, 0.1)" />
                    <XAxis stroke="rgba(224, 224, 224, 0.5)" />
                    <YAxis stroke="rgba(224, 224, 224, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(18, 24, 38, 0.8)",
                        border: "1px solid rgba(0, 245, 160, 0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Global Threat Map */}
            <CyberAttackMap />

            {/* Vulnerabilities Table */}
            <div className="glassmorphism rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Detected Vulnerabilities</h3>
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
    <div className="flex h-screen bg-background text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
