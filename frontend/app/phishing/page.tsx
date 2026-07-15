"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle, Radar, ShieldAlert } from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import PageShell from "@/components/PageShell"
import { SectionCard, StatTile, PrimaryButton } from "@/components/ui"

export default function PhishingDetection() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const [stats, setStats] = useState({
    total: 0, phishing: 0, legitimate: 0, suspicious: 0,
    blocked: 0, totalRiskScore: 0, mlDetected: 0, featureSuspicious: 0,
  })

  const detectionData = [
    { name: "Detected by ML", value: stats.mlDetected, color: "#3df5c4" },
    { name: "Suspicious", value: stats.featureSuspicious, color: "#ffcb4d" },
    { name: "Blocked", value: stats.blocked, color: "#8b8cff" },
  ]
  const classificationData = [
    { name: "Legitimate", value: stats.legitimate, fill: "#3df5c4" },
    { name: "Phishing", value: stats.phishing, fill: "#ff5470" },
    { name: "Suspicious", value: stats.suspicious, fill: "#ff8f4d" },
  ]

  const averageRiskScore =
    stats.total > 0 ? (stats.totalRiskScore / stats.total / 10).toFixed(1) : "0.0"
  const blockRate = stats.total > 0 ? "100.0%" : "0.0%"

  const tooltipStyle = {
    backgroundColor: "rgba(12,17,25,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "#eaf0f6",
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)
    try {
      if (!url.trim()) {
        setError("Please enter a URL")
        setLoading(false)
        return
      }
      const fullUrl = url.startsWith("http") ? url : `https://${url}`
      const response = await fetch("/api/phishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "Failed to analyze URL")
      setResult(data)
      setStats((prev) => {
        const isPhishing = data.risk_level === "High"
        const isSuspicious = data.risk_level === "Medium"
        const isLegit = data.risk_level === "Low"
        const blocked = data.features?.uses_ip ? 1 : 0
        const featSusp = (!isPhishing && data.features?.suspicious_keywords > 0) || isSuspicious ? 1 : 0
        return {
          total: prev.total + 1,
          phishing: prev.phishing + (isPhishing ? 1 : 0),
          legitimate: prev.legitimate + (isLegit ? 1 : 0),
          suspicious: prev.suspicious + (isSuspicious ? 1 : 0),
          blocked: prev.blocked + blocked,
          totalRiskScore: prev.totalRiskScore + data.phishing_probability_percent,
          mlDetected: prev.mlDetected + (isPhishing ? 1 : 0),
          featureSuspicious: prev.featureSuspicious + featSusp,
        }
      })
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const riskTone = (risk: string) =>
    risk === "High" ? "#ff5470" : risk === "Medium" ? "#ff8f4d" : "#3df5c4"

  return (
    <PageShell
      kicker="Threat Intelligence"
      title="Phishing Detection"
      description="ML-scored URL analysis with transparent, explainable confidence signals."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatTile label="Phishing attempts" value={stats.phishing} tone="crit" icon={AlertTriangle} />
        <StatTile label="Block rate" value={blockRate} tone="signal" icon={CheckCircle} />
        <StatTile label="Avg risk score" value={`${averageRiskScore}`} hint="out of 10" tone="iris" icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Detection Methods">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={detectionData.filter((d) => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}
                  label={({ name, value }: any) => `${name}: ${value}`}
                >
                  {detectionData.filter((d) => d.value > 0).map((e, i) => (
                    <Cell key={i} fill={e.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {stats.total === 0 && (
              <p className="text-center text-faint font-mono text-xs -mt-32">{"// analyze a URL to populate"}</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Classification">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ink-3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {classificationData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Check a URL">
        <form onSubmit={handleScan}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Radar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suspicious-site.example"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-void/60 border border-line text-foreground font-mono text-sm placeholder-faint focus:outline-none focus:border-signal/40"
              />
            </div>
            <PrimaryButton type="submit" disabled={loading} className="h-12 sm:w-auto">
              {loading ? "Analyzing…" : "Analyze URL"}
            </PrimaryButton>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg border border-crit/30 bg-crit/5 text-crit text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </form>
      </SectionCard>

      {result && (
        <SectionCard title="Analysis Result">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <p className="kicker mb-1.5">Target URL</p>
                <div className="font-mono text-sm break-all bg-void/60 p-3 rounded-lg border border-line text-muted">
                  {result.url}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-void/40 p-4 rounded-xl border border-line">
                  <p className="kicker mb-2">Risk Level</p>
                  <div className="font-mono text-2xl font-semibold" style={{ color: riskTone(result.risk_level) }}>
                    {result.risk_level.toUpperCase()}
                  </div>
                </div>
                <div className="bg-void/40 p-4 rounded-xl border border-line">
                  <p className="kicker mb-2">Confidence</p>
                  <div className="font-mono text-2xl font-semibold text-foreground tabular-nums">
                    {result.phishing_probability_percent}%
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="kicker mb-4">Detected Features</p>
              <ul className="space-y-0.5">
                {[
                  ["Suspicious keywords", result.features?.suspicious_keywords ?? 0],
                  ["URL length", result.features?.url_length ?? 0],
                  ["Subdomains", result.features?.subdomain_count ?? 0],
                  ["Special characters", result.features?.special_char_count ?? 0],
                  ["Uses IP address", result.features?.uses_ip ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <li key={k as string} className="flex justify-between py-2.5 border-b border-line last:border-0 text-sm">
                    <span className="text-muted">{k}</span>
                    <span className="font-mono text-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      )}
    </PageShell>
  )
}
