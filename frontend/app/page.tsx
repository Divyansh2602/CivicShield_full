"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Globe,
  Lock,
  Mail,
  MapPin,
  MoveRight,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const stats = useMemo(
    () => [
      { value: "847", label: "Vulnerabilities Detected" },
      { value: "156", label: "Threats Blocked Daily" },
      { value: "99.9%", label: "System Uptime" },
      { value: "24/7", label: "Monitoring Active" },
    ],
    []
  )

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const trimmed = url.trim()
      if (!trimmed) {
        setError("Please enter a valid URL")
        setLoading(false)
        return
      }

      const urlPattern =
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/
      if (!urlPattern.test(trimmed)) {
        setError("Please enter a valid URL format (e.g., example.com)")
        setLoading(false)
        return
      }

      const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
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

      router.push(`/dashboard?scanId=${data.scan_id}`)
    } catch {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const features = [
    {
      title: "Threat Detection",
      description: "Real-time threat detection powered by advanced AI algorithms",
      icon: ShieldAlert,
    },
    {
      title: "Vulnerability Scanning",
      description: "Comprehensive vulnerability assessments across your infrastructure",
      icon: Shield,
    },
    {
      title: "Attack Surface Management",
      description: "Monitor and manage your organization's external attack surface",
      icon: Globe,
    },
    {
      title: "Phishing Protection",
      description: "Advanced email security and phishing threat detection",
      icon: Mail,
    },
    {
      title: "API Security",
      description: "Secure and monitor API endpoints with behavioral analysis",
      icon: Lock,
    },
    {
      title: "Security Analytics",
      description: "Comprehensive reporting and security intelligence dashboards",
      icon: BarChart3,
    },
  ] as const

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header Navigation */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">CivicShield</span>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition border border-primary/30 shadow-[0_0_30px_rgba(0,245,160,0.18)]"
          >
            Launch Dashboard
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero / Scan Starter */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <div className="flex items-center justify-center">
            <div className="px-3 py-1 rounded-full border border-white/10 bg-card/40 backdrop-blur-md text-[11px] text-foreground/60 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Enterprise Cybersecurity Platform</span>
            </div>
          </div>

          <div className="text-center mt-7">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Protect Your Infrastructure
              <br />
              <span className="text-primary">with AI-Powered Security</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-foreground/60 max-w-2xl mx-auto">
              Real-time threat detection, vulnerability management, and comprehensive security
              intelligence for enterprise organizations
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <form
              onSubmit={handleScan}
              className="w-full max-w-xl glassmorphism-subtle rounded-2xl border border-primary/10 p-4 md:p-5"
            >
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className="flex-1 h-11 px-4 rounded-xl bg-white/95 border border-white/20 text-slate-900 placeholder-slate-500 caret-primary focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-5 rounded-xl bg-primary text-background font-semibold hover:bg-primary/90 transition border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Starting..." : "Get Started"}
                  {!loading && <MoveRight className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-critical mt-2">{error}</p>}
            </form>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-primary text-2xl md:text-3xl font-bold">{s.value}</div>
                  <div className="mt-1 text-[11px] md:text-xs text-foreground/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Comprehensive Security Platform
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground/60">
              Everything you need to protect your enterprise infrastructure
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="glassmorphism-subtle rounded-xl p-6 border border-primary/10 hover:border-primary/20 hover:bg-card/50 transition"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="glassmorphism rounded-2xl px-6 py-10 md:px-10 md:py-12 border border-primary/10 shadow-[0_0_60px_rgba(0,245,160,0.08)]">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Secure Your Enterprise?
              </h2>
              <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-2xl mx-auto">
                Join leading organizations using CivicShield for advanced threat detection and
                vulnerability management
              </p>
              <div className="mt-7">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition border border-primary/30"
                >
                  Launch Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-2 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-t border-primary/10">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">CivicShield</p>
                <p className="text-sm text-foreground/60 mt-1 max-w-sm">
                  AI-powered cybersecurity platform providing real-time threat detection,
                  vulnerability management, and advanced security intelligence.
                </p>
              </div>
            </div>

            <div className="md:justify-self-end">
              <p className="font-semibold text-foreground mb-3">Get in Touch</p>
              <div className="space-y-2 text-sm text-foreground/60">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <span>Vellore Institute of Technology, Vellore, Tamil Nadu, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>divyanshg2602@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Dual_Scammers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-foreground/50 pt-6">
            © {new Date().getFullYear()} CivicShield AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
