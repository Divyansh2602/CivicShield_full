"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, ShieldAlert, Cpu, AlertTriangle, ShieldCheck } from "lucide-react"

export interface ThreatInsight {
  type: "critical" | "warning" | "info" | "success"
  message: string
}

const ICONS = {
  critical: <ShieldAlert className="w-5 h-5 text-critical" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Cpu className="w-5 h-5 text-primary" />,
  success: <ShieldCheck className="w-5 h-5 text-[#00f5a0]" />,
}

const FALLBACK_INSIGHTS: ThreatInsight[] = [
  { type: "info", message: "Scan insights will appear here once reconnaissance and parameter analysis begin." },
  { type: "success", message: "The dashboard combines real scan results with a global cyber visualization layer for context." },
]

export default function AIThreatInsights({ insights }: { insights?: ThreatInsight[] }) {
  const resolvedInsights = useMemo(() => {
    const source = insights && insights.length > 0 ? insights : FALLBACK_INSIGHTS
    return source.map((item) => ({ ...item, icon: ICONS[item.type] }))
  }, [insights])

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setCurrentIndex(0)
  }, [resolvedInsights])

  useEffect(() => {
    if (resolvedInsights.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % resolvedInsights.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [resolvedInsights])

  return (
    <div className="glassmorphism rounded-lg p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
      <div className="flex items-start md:items-center flex-col md:flex-row gap-6 relative z-10">
        <div className="flex-shrink-0 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-background border border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.3)]">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Scan Intelligence Highlights</h2>
            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest border border-primary/30">Scan Derived</div>
          </div>

          <div className="h-16 relative w-full overflow-hidden bg-background/40 rounded border border-white/5 p-3 flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "anticipate" }}
                className="flex items-start gap-3 w-full"
              >
                <div className="flex-shrink-0 mt-0.5">{resolvedInsights[currentIndex].icon}</div>
                <p className="text-sm md:text-base text-foreground/90 font-mono leading-relaxed">{resolvedInsights[currentIndex].message}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-1 h-1">
            {resolvedInsights.map((_, i) => (
              <div key={i} className={`h-full rounded-full transition-all duration-500 flex-1 ${i === currentIndex ? "bg-primary" : "bg-primary/20"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
