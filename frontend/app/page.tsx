"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  Activity,
  BarChart3,
  Crosshair,
  Globe,
  Lock,
  Mail,
  MapPin,
  MoveRight,
  Network,
  Radar,
  Search,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react"
import Magnetic from "@/components/Magnetic"
import Reveal from "@/components/Reveal"

export default function Home() {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState("")

  // Wake the (free-tier) backend as soon as the page loads, so it's warm by the
  // time the user starts a scan — avoids the ~60s cold-start timeout on submit.
  useEffect(() => {
    fetch("/api/health").catch(() => {})
  }, [])

  const stats = useMemo(
    () => [
      { value: "847", label: "Vulnerabilities detected" },
      { value: "156", label: "Threats blocked / day" },
      { value: "99.9%", label: "System uptime" },
      { value: "24/7", label: "Active monitoring" },
    ],
    []
  )

  // Scan submission — contract preserved exactly.
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const trimmed = url.trim()
      if (!trimmed) {
        setError("Enter a target to acquire")
        setLoading(false)
        return
      }

      const urlPattern =
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/
      if (!urlPattern.test(trimmed)) {
        setError("Invalid target format (e.g. example.com)")
        setLoading(false)
        return
      }

      const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`

      // The backend may be cold-starting (~60s on the free tier). Retry a few
      // times so the first scan of the session doesn't fail on a wake-up.
      const maxAttempts = 3
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: fullUrl }),
          })
          const data = await response.json().catch(() => ({}))

          if (response.ok && data.scan_id) {
            router.push(`/dashboard?scanId=${data.scan_id}`)
            return
          }

          // 502/503/504 => backend still waking; otherwise it's a real error.
          const waking = response.status === 502 || response.status === 503 || response.status === 504
          if (!waking || attempt === maxAttempts) {
            setError(data.detail || "Failed to start scan")
            setLoading(false)
            return
          }
        } catch {
          if (attempt === maxAttempts) {
            setError("Couldn't reach the scanner. Please try again in a moment.")
            setLoading(false)
            return
          }
        }
        setError("Waking up the scanner… this can take up to a minute on the first scan.")
        await new Promise((r) => setTimeout(r, 4000))
      }
    } catch {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const pipeline = [
    { n: "01", label: "Recon", icon: Search },
    { n: "02", label: "Crawl", icon: Network },
    { n: "03", label: "Surface map", icon: Globe },
    { n: "04", label: "Param discovery", icon: Crosshair },
    { n: "05", label: "Inject & fuzz", icon: ShieldAlert },
    { n: "06", label: "Score risk", icon: Activity },
  ] as const

  const features = [
    { title: "Threat Detection", description: "Real-time detection surfaced from active scan telemetry.", icon: ShieldAlert },
    { title: "Vulnerability Scanning", description: "Live SQLi, XSS and IDOR probes against your endpoints.", icon: Shield },
    { title: "Attack Surface", description: "Crawl, extract, and correlate every reachable route.", icon: Network },
    { title: "Phishing Protection", description: "ML-scored URL analysis with transparent confidence.", icon: Mail },
    { title: "API Security", description: "Endpoint monitoring with auth and rate-limit signals.", icon: Lock },
    { title: "Security Analytics", description: "Executive risk scores and audit-ready PDF reports.", icon: BarChart3 },
  ] as const

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: 0.05 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ===== Header ===== */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-signal/10 border border-signal/25 flex items-center justify-center shadow-signal-sm">
              <Shield className="w-[18px] h-[18px] text-signal" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">CivicShield</span>
          </div>

          <Magnetic strength={0.4}>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-signal-gradient text-void font-semibold text-sm hover:brightness-110 transition shadow-signal-sm"
            >
              Launch Console
            </Link>
          </Magnetic>
        </div>
      </header>

      <main className="relative z-10">
        {/* ===== Hero ===== */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-10">
          <motion.div variants={container} initial="hidden" animate="show" className="text-center">
            {/* Kicker */}
            <motion.div variants={item} className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line-strong bg-surface/60 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal" />
                </span>
                <span className="kicker text-signal/80">Offensive Security Intelligence</span>
              </div>
            </motion.div>

            {/* Display headline — the LCP element. Rendered visible immediately
                (no JS-hydration-gated opacity animation) so it paints on first
                frame. Keeps LCP render-delay near zero. */}
            <h1 className="display text-foreground mt-8 text-[clamp(3rem,11vw,7.5rem)]">
              Acquire the target.
              <br />
              <span className="text-transparent bg-clip-text bg-signal-gradient">Map the exposure.</span>
            </h1>

            <motion.p
              variants={item}
              className="mt-6 text-[15px] md:text-lg text-muted max-w-2xl mx-auto leading-relaxed"
            >
              CivicShield crawls, probes, and scores any web target in real time — turning a single
              URL into a live attack-surface map and an executive-grade risk verdict.
            </motion.p>

            {/* ===== Signature: Target Acquisition reticle ===== */}
            <motion.div variants={item} className="mt-11 flex flex-col items-center">
              <form onSubmit={handleScan} className="w-full max-w-xl">
                <div className={`reticle ${focused || loading ? "is-locked" : ""} p-[3px]`}>
                  <span className="reticle__bracket reticle__bracket--tl" />
                  <span className="reticle__bracket reticle__bracket--tr" />
                  <span className="reticle__bracket reticle__bracket--bl" />
                  <span className="reticle__bracket reticle__bracket--br" />

                  <div
                    className={`relative rounded-2xl border bg-surface/70 backdrop-blur-xl p-2.5 md:p-3 transition-colors ${
                      focused || loading ? "border-signal/40" : "border-line-strong"
                    }`}
                  >
                    {loading && <span className="sweep rounded-2xl" aria-hidden="true" />}

                    <div className="relative flex flex-col md:flex-row gap-2.5 items-stretch">
                      <div className="relative flex-1">
                        <Radar
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                            focused || loading ? "text-signal" : "text-faint"
                          }`}
                        />
                        <input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          placeholder="example.com"
                          aria-label="Target URL"
                          className="w-full h-12 pl-10 pr-4 rounded-xl bg-void/60 border border-line text-foreground font-mono text-sm placeholder-faint focus:outline-none focus:border-signal/40"
                        />
                      </div>

                      <Magnetic strength={0.25}>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full md:w-auto h-12 px-6 rounded-xl bg-signal-gradient text-void font-semibold hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-signal-sm"
                        >
                          {loading ? "Acquiring target…" : "Begin scan"}
                          {!loading && <MoveRight className="w-4 h-4" />}
                        </button>
                      </Magnetic>
                    </div>
                  </div>
                </div>

                <div className="h-5 mt-2.5">
                  {error && <p className="text-xs font-mono text-crit">{error}</p>}
                  {!error && (
                    <p className="text-[11px] font-mono text-faint">
                      Only scan assets you own or are authorized to assess.
                    </p>
                  )}
                </div>
              </form>

              {/* Stats — mono numerals */}
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 w-full max-w-2xl">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-mono text-2xl md:text-3xl font-semibold text-foreground tabular-nums">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[11px] text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ===== Pipeline strip (what the scan actually does) ===== */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
          <Reveal className="panel px-5 md:px-8 py-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="kicker">Scan pipeline</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipeline.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.n} className="group flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-signal/70">{p.n}</span>
                      <span className="h-px flex-1 bg-line group-hover:bg-signal/30 transition-colors" />
                    </div>
                    <Icon className="w-5 h-5 text-muted group-hover:text-signal transition-colors" />
                    <span className="text-[13px] font-medium text-foreground">{p.label}</span>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* ===== Capabilities ===== */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 pb-8">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="kicker">Capabilities</span>
            <h2 className="display text-foreground text-[clamp(2.2rem,6vw,4rem)] mt-3">
              One console. Full coverage.
            </h2>
            <p className="mt-4 text-[15px] text-muted">
              Every module reads from the same live scan — no stitching tools together.
            </p>
          </Reveal>

          <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <Reveal key={f.title} delay={i}>
                  <div className="panel hover-lift h-full p-6">
                    <div className="w-11 h-11 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-signal" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-14">
          <Reveal className="relative panel overflow-hidden px-6 py-14 md:px-12 md:py-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(61,245,196,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative">
              <span className="kicker">Ready when you are</span>
              <h2 className="display text-foreground text-[clamp(2.4rem,7vw,5rem)] mt-3">
                Lock onto your first target
              </h2>
              <p className="mt-4 text-[15px] text-muted max-w-xl mx-auto">
                Paste a URL above, or open the console to explore a live command center.
              </p>
              <div className="mt-8 flex justify-center">
                <Magnetic strength={0.4}>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-signal-gradient text-void font-semibold hover:brightness-110 transition shadow-signal-sm"
                  >
                    Launch Console
                    <MoveRight className="w-4 h-4" />
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 pb-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-t border-line">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center mt-0.5">
                <Shield className="w-[18px] h-[18px] text-signal" />
              </div>
              <div>
                <p className="font-semibold text-foreground">CivicShield</p>
                <p className="text-sm text-muted mt-1 max-w-sm leading-relaxed">
                  AI-powered offensive security intelligence — attack-surface mapping, vulnerability
                  scanning, and phishing detection in one console.
                </p>
              </div>
            </div>

            <div className="md:justify-self-end">
              <p className="kicker mb-3">Get in touch</p>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-signal mt-0.5" />
                  <span>Vellore Institute of Technology, Vellore, Tamil Nadu, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-signal" />
                  <span className="font-mono text-[13px]">divyanshg2602@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-signal" />
                  <span>Dual_Scammers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-faint pt-6">
            © {new Date().getFullYear()} CivicShield AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
