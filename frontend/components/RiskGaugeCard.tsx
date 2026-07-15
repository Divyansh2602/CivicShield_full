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

  const getRisk = (s: number) => {
    if (s >= 75) return { label: "CRITICAL", color: "#ff5470", note: "Immediate action required" }
    if (s >= 50) return { label: "HIGH", color: "#ff8f4d", note: "High-priority exposure" }
    if (s >= 25) return { label: "MEDIUM", color: "#ffcb4d", note: "Review recommendations" }
    return { label: "LOW", color: "#3df5c4", note: "Healthy security posture" }
  }

  const risk = getRisk(animatedScore)
  const R = 52
  const circumference = 2 * Math.PI * R
  const offset = circumference - (animatedScore / 100) * circumference

  // Instrument tick marks around the dial
  const ticks = Array.from({ length: 40 })

  return (
    <div className="panel p-6 flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-between mb-4">
        <span className="kicker">Threat Index</span>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border" style={{ color: risk.color, borderColor: `${risk.color}44`, background: `${risk.color}12` }}>
          {risk.label}
        </span>
      </div>

      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
          {/* Tick ring */}
          <g transform="translate(65,65)">
            {ticks.map((_, i) => {
              const angle = (i / ticks.length) * 360
              const active = (i / ticks.length) * 100 <= animatedScore
              return (
                <rect
                  key={i}
                  x={61}
                  y={-0.75}
                  width={4}
                  height={1.5}
                  rx={0.75}
                  fill={active ? risk.color : "rgba(255,255,255,0.09)"}
                  transform={`rotate(${angle})`}
                />
              )
            })}
          </g>

          {/* Track */}
          <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Progress */}
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke={risk.color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-semibold tabular-nums" style={{ color: risk.color }}>
            {animatedScore}
          </span>
          <span className="font-mono text-[10px] text-faint mt-0.5">/ 100</span>
        </div>
      </div>

      <p className="text-xs text-muted text-center mt-4">{risk.note}</p>
    </div>
  )
}
