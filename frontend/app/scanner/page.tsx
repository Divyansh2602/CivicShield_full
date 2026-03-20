"use client"

import { useState } from "react"
import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { AlertTriangle, Play } from "lucide-react"

export default function Scanner() {
  const [url, setUrl] = useState("")
  const [scanType, setScanType] = useState("full")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!url.trim()) {
        setError("Please enter a target URL")
        setLoading(false)
        return
      }

      const fullUrl = url.startsWith("http") ? url : `https://${url}`
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: fullUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Failed to start scan")
        setLoading(false)
        return
      }

      // Redirect to dashboard
      window.location.href = `/dashboard?scanId=${data.scan_id}`
    } catch (err) {
      setError("The request could not reach the backend. If Render is cold-starting, wait a few seconds and retry.")
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Vulnerability Scanner</h1>

            <form onSubmit={handleStartScan} className="space-y-6">
              {/* Target URL Input */}
              <div className="glassmorphism rounded-lg p-6">
                <label htmlFor="target-url" className="block text-lg font-bold mb-3">
                  Target URL
                </label>
                <input
                  id="target-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className="w-full px-4 py-3 bg-card border border-primary/20 rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-sm text-foreground/60 mt-2">
                  Enter the domain or URL you want to scan for vulnerabilities
                </p>
              </div>

              {/* Scan Type Selection */}
              <div className="glassmorphism rounded-lg p-6">
                <label className="block text-lg font-bold mb-4">Scan Type</label>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "full",
                      name: "Full Scan",
                      desc: "Complete vulnerability assessment",
                    },
                    {
                      id: "quick",
                      name: "Quick Scan",
                      desc: "Fast surface-level check",
                    },
                    {
                      id: "api",
                      name: "API Scan",
                      desc: "Focus on API endpoints",
                    },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        scanType === type.id
                          ? "border-primary bg-primary/10"
                          : "border-primary/20 hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scanType"
                        value={type.id}
                        checked={scanType === type.id}
                        onChange={(e) => setScanType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="font-bold">{type.name}</div>
                      <div className="text-sm text-foreground/60">{type.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="glassmorphism rounded-lg p-4 border border-critical/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-critical flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {loading ? "Starting Scan..." : "Start Vulnerability Scan"}
              </button>
            </form>

            {/* Info Section */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="glassmorphism rounded-lg p-6">
                <h3 className="font-bold mb-3">Full Scan Includes:</h3>
                <ul className="text-sm text-foreground/70 space-y-2">
                  <li>SQL Injection detection</li>
                  <li>Cross-Site Scripting (XSS)</li>
                  <li>API endpoint enumeration</li>
                  <li>Security misconfigurations</li>
                  <li>Phishing threat analysis</li>
                </ul>
              </div>
              <div className="glassmorphism rounded-lg p-6">
                <h3 className="font-bold mb-3">Scan Results Include:</h3>
                <ul className="text-sm text-foreground/70 space-y-2">
                  <li>Risk severity levels</li>
                  <li>Vulnerability descriptions</li>
                  <li>Affected endpoints</li>
                  <li>Remediation guidance</li>
                  <li>PDF report download</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

