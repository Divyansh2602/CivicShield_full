"use client"

import { useEffect, useState } from "react"

interface RiskGaugeCardProps {
  score: number
}

export default function RiskGaugeCard({ score }: RiskGaugeCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.ceil(score / 30)
      if (current >= score) {
        current = score
        clearInterval(interval)
      }
      setAnimatedScore(current)
    }, 50)
    return () => clearInterval(interval)
  }, [score])

  const getRiskLevel = (s: number) => {
    if (s >= 75) return { label: "CRITICAL", color: "text-critical" }
    if (s >= 50) return { label: "HIGH", color: "text-warning" }
    if (s >= 25) return { label: "MEDIUM", color: "text-primary" }
    return { label: "LOW", color: "text-primary" }
  }

  const risk = getRiskLevel(animatedScore)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="glassmorphism rounded-lg p-6 flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-foreground/60 mb-4">Cyber Risk Score</h3>
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="rgba(0, 245, 160, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={animatedScore >= 75 ? "#ff4d4f" : animatedScore >= 50 ? "#ffb020" : "#00f5a0"}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${risk.color}`}>{animatedScore}</span>
          <span className="text-xs text-foreground/60">/100</span>
        </div>
      </div>
      <div className={`text-sm font-bold ${risk.color}`}>{risk.label}</div>
      <p className="text-xs text-foreground/50 text-center mt-2">
        {risk.label === "CRITICAL" ? "Immediate action required" :
         risk.label === "HIGH" ? "High priority vulnerabilities" :
         risk.label === "MEDIUM" ? "Review recommendations" :
         "Good security posture"}
      </p>
    </div>
  )
}
