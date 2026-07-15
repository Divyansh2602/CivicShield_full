"use client"

import { useState } from "react"
import { AlertTriangle, Radar, ShieldCheck, FileCheck } from "lucide-react"
import PageShell from "@/components/PageShell"
import { SectionCard, PrimaryButton } from "@/components/ui"

const SCAN_TYPES = [
  { id: "full", name: "Full Scan", desc: "Complete vulnerability assessment" },
  { id: "quick", name: "Quick Scan", desc: "Fast surface-level check" },
  { id: "api", name: "API Scan", desc: "Focus on API endpoints" },
] as const

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
      window.location.href = `/dashboard?scanId=${data.scan_id}`
    } catch {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <PageShell
      kicker="Reconnaissance"
      title="Vulnerability Scanner"
      description="Point CivicShield at a target and launch a live scan — crawl, probe, and score in one pass."
    >
      <form onSubmit={handleStartScan} className="space-y-6">
        <SectionCard title="Target">
          <label htmlFor="target-url" className="sr-only">Target URL</label>
          <div className="relative">
            <Radar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input
              id="target-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-void/60 border border-line text-foreground font-mono text-sm placeholder-faint focus:outline-none focus:border-signal/40"
            />
          </div>
          <p className="text-xs text-muted mt-3 font-mono">
            Only scan assets you own or are authorized to assess.
          </p>
        </SectionCard>

        <SectionCard title="Scan Profile">
          <div className="grid md:grid-cols-3 gap-4">
            {SCAN_TYPES.map((type) => {
              const active = scanType === type.id
              return (
                <label
                  key={type.id}
                  className={`p-5 rounded-xl border cursor-pointer transition ${
                    active
                      ? "border-signal/50 bg-signal/[0.06] shadow-signal-sm"
                      : "border-line hover:border-line-strong hover:bg-white/[0.02]"
                  }`}
                >
                  <input
                    type="radio"
                    name="scanType"
                    value={type.id}
                    checked={active}
                    onChange={(e) => setScanType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`font-semibold text-sm ${active ? "text-signal" : "text-foreground"}`}>
                    {type.name}
                  </div>
                  <div className="text-xs text-muted mt-1">{type.desc}</div>
                </label>
              )
            })}
          </div>
        </SectionCard>

        {error && (
          <div className="panel p-4 border-crit/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-crit flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        <PrimaryButton type="submit" disabled={loading} className="w-full h-12">
          <Radar className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Acquiring target…" : "Start vulnerability scan"}
        </PrimaryButton>
      </form>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Full scan includes">
          <ul className="space-y-2.5 text-sm text-muted">
            {["SQL Injection detection", "Cross-Site Scripting (XSS)", "IDOR / broken access control", "API endpoint enumeration", "Attack-surface mapping"].map((i) => (
              <li key={i} className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-signal flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Results include">
          <ul className="space-y-2.5 text-sm text-muted">
            {["Risk-scored severity levels", "Payload & evidence per finding", "Affected endpoints & params", "Live threat globe & charts", "Audit-ready PDF report"].map((i) => (
              <li key={i} className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-iris flex-shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </PageShell>
  )
}
