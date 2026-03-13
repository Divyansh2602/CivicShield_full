"use client"

import { useState } from "react"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { AlertTriangle } from "lucide-react"

export default function PhishingDetection() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

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
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="flex h-screen bg-background text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Phishing Detection</h1>

            <form onSubmit={handleScan} className="space-y-6 mb-8">
              <div className="glassmorphism rounded-lg p-6">
                <label htmlFor="phishing-url" className="block text-lg font-bold mb-3">
                  Check URL for Phishing
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    id="phishing-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-card border border-primary/20 rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                  >
                    {loading ? "Analyzing..." : "Analyze URL"}
                  </button>
                </div>
                <p className="text-sm text-foreground/60 mt-2">
                  Enter a suspicious URL to analyze it using our AI phishing detection model.
                </p>
                {error && (
                  <div className="mt-4 p-3 border border-critical/30 rounded text-critical text-sm bg-critical/5 flex items-center gap-2">
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
                      <div className="font-mono text-sm break-all bg-card/50 p-3 rounded border border-primary/10">
                        {result.url}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Risk Level</div>
                        <div className={`text-2xl font-bold ${getRiskColor(result.risk_level)}`}>
                          {result.risk_level.toUpperCase()}
                        </div>
                      </div>
                      <div className="bg-card/50 p-4 rounded border border-primary/10">
                        <div className="text-sm font-semibold text-foreground/60 mb-2">Confidence</div>
                        <div className="text-2xl font-bold">
                          {result.phishing_probability_percent}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/60 mb-4">Detected Features</h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between p-2 border-b border-primary/5">
                        <span>Suspicious Keywords</span>
                        <span className="font-mono">{result.features?.suspicious_keywords || 0}</span>
                      </li>
                      <li className="flex justify-between p-2 border-b border-primary/5">
                        <span>URL Length</span>
                        <span className="font-mono">{result.features?.url_length || 0}</span>
                      </li>
                      <li className="flex justify-between p-2 border-b border-primary/5">
                        <span>Subdomains</span>
                        <span className="font-mono">{result.features?.subdomain_count || 0}</span>
                      </li>
                      <li className="flex justify-between p-2 border-b border-primary/5">
                        <span>Special Characters</span>
                        <span className="font-mono">{result.features?.special_char_count || 0}</span>
                      </li>
                      <li className="flex justify-between p-2">
                        <span>Uses IP Address</span>
                        <span className="font-mono">{result.features?.uses_ip ? 'Yes' : 'No'}</span>
                      </li>
                    </ul>
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
