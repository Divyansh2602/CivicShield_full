"use client"

import { useMemo, useState } from "react"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { AlertTriangle, CheckCircle, Shield } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const SAMPLE_URLS = [
  "https://openai.com/research",
  "https://accounts.google.com/signin/v2/identifier",
  "http://paypal.verify-account.top/webscr?auth=reset",
  "http://198.51.100.24/secure-login?session=445566",
]

export default function PhishingDetection() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const currentRiskScore = result ? (Number(result.phishing_probability_percent || 0) / 10).toFixed(1) : "0.0"
  const currentClassification = result?.risk_level || "Low"
  const protocolSignal = result?.features?.uses_ip ? "Elevated" : "Normal"

  const detectionData = useMemo(() => {
    if (!result) return []

    return [
      { name: "Detected by ML", value: result.risk_level === "High" ? 1 : 0, color: "#00FA9A" },
      {
        name: "Suspicious Signals",
        value: result.risk_level === "Medium" || (result.features?.suspicious_keywords || 0) > 0 ? 1 : 0,
        color: "#FFB800",
      },
      { name: "Protocol Flags", value: result.features?.uses_ip ? 1 : 0, color: "#3B82F6" },
    ].filter((item) => item.value > 0)
  }, [result])

  const classificationData = useMemo(() => {
    if (!result) {
      return [
        { name: "Legitimate", value: 0, fill: "#00FA9A" },
        { name: "Phishing", value: 0, fill: "#ef4444" },
        { name: "Suspicious", value: 0, fill: "#f59e0b" },
      ]
    }

    return [
      { name: "Legitimate", value: result.risk_level === "Low" ? 1 : 0, fill: "#00FA9A" },
      { name: "Phishing", value: result.risk_level === "High" ? 1 : 0, fill: "#ef4444" },
      { name: "Suspicious", value: result.risk_level === "Medium" ? 1 : 0, fill: "#f59e0b" },
    ]
  }, [result])

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
      if (!response.ok) {
        throw new Error(data.detail || "Failed to analyze URL")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    if (risk === "High") return "text-critical"
    if (risk === "Medium") return "text-warning"
    return "text-success text-primary"
  }

  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Phishing & Email Security</h1>
              <p className="text-foreground/60 mt-2">URL phishing classification with calibrated probabilities, lexical feature analysis, and explainable risk flags.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glassmorphism rounded-lg p-6 flex flex-col justify-between border border-primary/10">
                <div className="flex items-center gap-2 text-critical mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Current Classification</span>
                </div>
                <div className={`text-4xl font-bold ${getRiskColor(currentClassification)}`}>{currentClassification.toUpperCase()}</div>
              </div>

              <div className="glassmorphism rounded-lg p-6 flex flex-col justify-between border border-primary/10">
                <div className="flex items-center gap-2 text-success mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Protocol Signal</span>
                </div>
                <div className="text-4xl font-bold text-success">{protocolSignal}</div>
              </div>

              <div className="glassmorphism rounded-lg p-6 flex flex-col justify-between border border-primary/10">
                <div className="flex items-center gap-2 text-foreground/80 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">Risk Score</span>
                </div>
                <div className="text-4xl font-bold text-foreground">{currentRiskScore}/10</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="glassmorphism rounded-lg p-6 border border-primary/10">
                <h3 className="text-lg font-bold mb-6 text-foreground">Detection Methods</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={detectionData} cx="50%" cy="50%" innerRadius={0} outerRadius={75} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                        {detectionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glassmorphism rounded-lg p-6 border border-primary/10">
                <h3 className="text-lg font-bold mb-6 text-foreground">Classification Summary</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classificationData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="currentColor" tick={{ fill: "currentColor", opacity: 0.6, fontSize: "12px" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
                      <YAxis stroke="currentColor" tick={{ fill: "currentColor", opacity: 0.6, fontSize: "12px" }} axisLine={false} tickLine={false} tickFormatter={(val) => (val === 0 ? "0" : val.toString())} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {classificationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <form onSubmit={handleScan} className="space-y-6 mb-8">
              <div className="glassmorphism rounded-lg p-6 space-y-5">
                <div>
                  <label htmlFor="phishing-url" className="block text-lg font-bold mb-3">Check URL for Phishing</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input id="phishing-url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-3 bg-card border border-primary/20 rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
                    <button type="submit" disabled={loading} className="px-6 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap">
                      {loading ? "Analyzing..." : "Analyze URL"}
                    </button>
                  </div>
                  <p className="text-sm text-foreground/60 mt-2">The model combines character-level TF-IDF with lexical URL features and calibrated logistic regression.</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground/60 mb-3">Quick Demo Samples</p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_URLS.map((sample) => (
                      <button key={sample} type="button" onClick={() => setUrl(sample)} className="text-left px-3 py-2 rounded border border-primary/10 bg-card/50 hover:bg-primary/10 text-xs font-mono text-foreground/80 transition">
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 border border-critical/30 rounded text-critical text-sm bg-critical/5 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            </form>

            {result && (
              <div className="glassmorphism rounded-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-6 border-b border-primary/20 pb-4">Analysis Result</h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-semibold text-foreground/60 mb-1">Target URL</div>
                      <div className="font-mono text-sm break-all bg-card/50 p-3 rounded border border-primary/10">{result.url}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Risk Level</div>
                        <div className={`text-2xl font-bold ${getRiskColor(result.risk_level)}`}>{result.risk_level.toUpperCase()}</div>
                      </div>
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Confidence</div>
                        <div className="text-2xl font-bold">{result.phishing_probability_percent}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Model Type</div>
                        <div className="text-sm font-mono break-words">{result.model_type || "URL classifier"}</div>
                      </div>
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Model Version</div>
                        <div className="text-sm font-mono">{result.model_version || "2026.03-hackathon"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground/60 mb-4">Detected Features</h3>
                      <ul className="space-y-3">
                        <li className="flex justify-between p-2 border-b border-primary/5"><span>Suspicious Keywords</span><span className="font-mono">{result.features?.suspicious_keywords || 0}</span></li>
                        <li className="flex justify-between p-2 border-b border-primary/5"><span>URL Length</span><span className="font-mono">{result.features?.url_length || 0}</span></li>
                        <li className="flex justify-between p-2 border-b border-primary/5"><span>Subdomains</span><span className="font-mono">{result.features?.subdomain_count || 0}</span></li>
                        <li className="flex justify-between p-2 border-b border-primary/5"><span>Special Characters</span><span className="font-mono">{result.features?.special_char_count || 0}</span></li>
                        <li className="flex justify-between p-2"><span>Uses IP Address</span><span className="font-mono">{result.features?.uses_ip ? "Yes" : "No"}</span></li>
                      </ul>
                    </div>

                    {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground/60 mb-4">Why It Was Flagged</h3>
                        <ul className="space-y-2">
                          {result.reasons.map((reason: string, index: number) => (
                            <li key={index} className="text-sm bg-card/50 p-3 rounded border border-primary/10">{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
