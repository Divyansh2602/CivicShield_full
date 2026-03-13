"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!url.trim()) {
        setError("Please enter a valid URL")
        setLoading(false)
        return
      }

      // Validate URL format
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/
      if (!urlPattern.test(url)) {
        setError("Please enter a valid URL format (e.g., example.com or https://example.com)")
        setLoading(false)
        return
      }

      // Start scan
      const fullUrl = url.startsWith("http") ? url : `https://${url}`
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target: fullUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Failed to start scan")
        setLoading(false)
        return
      }

      // Redirect to dashboard with scan ID
      router.push(`/dashboard?scanId=${data.scan_id}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card bg-cyber-grid relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 border-b border-primary/10 backdrop-blur-sm bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary glow-text" />
            <h1 className="text-2xl font-bold text-primary glow-text">CivicShield AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-primary transition">Features</a>
            <a href="#how-it-works" className="text-foreground/70 hover:text-primary transition">How It Works</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary glow-text">AI-Powered</span> Security Analysis
            </h2>
            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
              Detect vulnerabilities, analyze attack surfaces, and identify security threats in seconds using advanced AI technology.
            </p>
          </div>

          {/* Scan Form */}
          <div className="mb-16">
            <form onSubmit={handleScan} className="glassmorphism rounded-lg p-8 md:p-12">
              <div className="space-y-4">
                <label htmlFor="url" className="block text-foreground font-semibold">
                  Target Website URL
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    id="url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com or https://example.com"
                    className="flex-1 px-4 py-3 rounded-lg bg-card border border-primary/20 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {loading ? "Scanning..." : "Start Scan"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-critical text-sm mt-2">{error}</p>
                )}
              </div>
            </form>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glassmorphism rounded-lg p-6">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Fast Scanning</h3>
              <p className="text-foreground/60 text-sm">
                Lightning-fast vulnerability detection using advanced scanning algorithms.
              </p>
            </div>
            <div className="glassmorphism rounded-lg p-6">
              <TrendingUp className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Risk Assessment</h3>
              <p className="text-foreground/60 text-sm">
                Comprehensive risk scoring and vulnerability prioritization for your assets.
              </p>
            </div>
            <div className="glassmorphism rounded-lg p-6">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Security Reports</h3>
              <p className="text-foreground/60 text-sm">
                Generate detailed security reports with remediation recommendations.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="glassmorphism rounded-lg p-8 md:p-12">
            <h3 className="text-2xl font-bold mb-8 text-center">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mx-auto mb-4">1</div>
                <p className="text-sm text-foreground/70">Enter your website URL</p>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-1 bg-primary/20" />
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mx-auto mb-4">2</div>
                <p className="text-sm text-foreground/70">AI analyzes security</p>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-1 bg-primary/20" />
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mx-auto mb-4">3</div>
                <p className="text-sm text-foreground/70">Get detailed results</p>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-1 bg-primary/20" />
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mx-auto mb-4">4</div>
                <p className="text-sm text-foreground/70">Download PDF report</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 bg-card/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-foreground/50 text-sm">
          <p>CivicShield AI - Enterprise Cybersecurity Platform © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
