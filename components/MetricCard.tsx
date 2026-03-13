"use client"

import { useEffect, useState } from "react"
import { ReactNode } from "react"

interface MetricCardProps {
  label: string
  value: number
  color?: "critical" | "warning" | "primary" | "success"
  icon?: ReactNode
}

export default function MetricCard({ label, value, color = "primary", icon }: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.ceil(value / 20)
      if (current >= value) {
        current = value
        clearInterval(interval)
      }
      setAnimatedValue(current)
    }, 50)
    return () => clearInterval(interval)
  }, [value])

  const colorClasses = {
    critical: "text-critical",
    warning: "text-warning",
    primary: "text-primary",
    success: "text-primary",
  }

  return (
    <div className="glassmorphism rounded-lg p-6 flex flex-col hover-lift cursor-default relative overflow-hidden group">
      {/* Dynamic Background Glow on Hover */}
      <div className={`absolute -inset-1 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-lg pointer-events-none ${colorClasses[color].replace('text-', 'bg-')}`} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <span className="text-sm font-semibold text-foreground/60">{label}</span>
        {icon && <div className={colorClasses[color]}>{icon}</div>}
      </div>
      <div className={`text-4xl font-bold ${colorClasses[color]} mb-2 relative z-10`}>
        {animatedValue}
      </div>
      <div className="w-full bg-background/50 rounded h-1 relative z-10">
        <div
          className={`h-full rounded transition-all duration-300 ${color === "critical" ? "bg-critical" :
              color === "warning" ? "bg-warning" :
                "bg-primary"
            }`}
          style={{ width: `${(animatedValue / Math.max(value, 10)) * 100}%` }}
        />
      </div>
    </div>
  )
}
