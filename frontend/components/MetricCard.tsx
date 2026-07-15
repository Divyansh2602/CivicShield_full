"use client"

import { useEffect, useState, ReactNode } from "react"

interface MetricCardProps {
  label: string
  value: number
  color?: "critical" | "warning" | "primary" | "success"
  icon?: ReactNode
}

const TONE: Record<NonNullable<MetricCardProps["color"]>, string> = {
  critical: "var(--crit)",
  warning: "var(--high)",
  primary: "var(--signal)",
  success: "var(--signal)",
}

export default function MetricCard({ label, value, color = "primary", icon }: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const tone = TONE[color]

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.max(1, Math.ceil(value / 20))
      if (current >= value) {
        current = value
        clearInterval(interval)
      }
      setAnimatedValue(current)
    }, 50)
    return () => clearInterval(interval)
  }, [value])

  const pct = Math.min((animatedValue / Math.max(value, 10)) * 100, 100)

  return (
    <div className="panel hover-lift p-6 flex flex-col relative overflow-hidden group">
      {/* Severity glow on hover */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{ background: tone }}
      />

      <div className="flex items-start justify-between mb-4 relative">
        <span className="kicker">{label}</span>
        {icon && <div style={{ color: tone }}>{icon}</div>}
      </div>

      <div className="font-mono text-4xl font-semibold mb-3 tabular-nums relative" style={{ color: tone }}>
        {String(animatedValue).padStart(2, "0")}
      </div>

      <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
    </div>
  )
}
