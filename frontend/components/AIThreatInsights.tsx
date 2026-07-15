"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ShieldAlert, Cpu, Activity, AlertTriangle, ShieldCheck } from 'lucide-react'

const INSIGHTS_POOL = [
    {
        type: "critical",
        icon: <ShieldAlert className="w-4 h-4" style={{ color: "var(--crit)" }} />,
        message: "Repeated SQL injection attempts detected targeting login API from multiple IP addresses."
    },
    {
        type: "warning",
        icon: <AlertTriangle className="w-4 h-4" style={{ color: "var(--high)" }} />,
        message: "Anomalous data exfiltration patterns observed on /api/v1/users/export. Rate limiting recommended."
    },
    {
        type: "info",
        icon: <Cpu className="w-4 h-4" style={{ color: "var(--info)" }} />,
        message: "Machine-learning heuristic signature matches new zero-day mutation payload on admin portal."
    },
    {
        type: "success",
        icon: <ShieldCheck className="w-4 h-4 text-signal" />,
        message: "Automated WAF rules successfully blocked 43 malicious crawler bots in the last 15 minutes."
    },
    {
        type: "critical",
        icon: <Activity className="w-4 h-4" style={{ color: "var(--crit)" }} />,
        message: "High-frequency credential stuffing attack detected against primary authentication gateway."
    }
]

export default function AIThreatInsights() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % INSIGHTS_POOL.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="panel p-6 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-signal/10 rounded-full blur-3xl group-hover:bg-signal/15 transition-all duration-1000 pointer-events-none" />

            <div className="flex items-start md:items-center flex-col md:flex-row gap-6 relative">
                {/* AI orb */}
                <div className="flex-shrink-0 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-signal/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 bg-signal/30 rounded-full animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-void border border-signal/40 flex items-center justify-center shadow-signal-sm">
                        <Brain className="w-7 h-7 text-signal" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2.5 mb-3">
                        <h2 className="text-lg font-semibold text-foreground">AI Threat Insights</h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-signal/10 border border-signal/25">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal" />
                            </span>
                            <span className="font-mono text-[9px] font-semibold tracking-widest2 uppercase text-signal">Live</span>
                        </div>
                    </div>

                    <div className="h-16 relative w-full overflow-hidden bg-void/50 rounded-lg border border-line px-4 flex items-center">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.5, ease: "anticipate" }}
                                className="flex items-start gap-3 w-full"
                            >
                                <div className="flex-shrink-0 mt-0.5">{INSIGHTS_POOL[currentIndex].icon}</div>
                                <p className="text-[13px] text-foreground/90 font-mono leading-relaxed">
                                    {INSIGHTS_POOL[currentIndex].message}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-3 flex gap-1.5 h-1">
                        {INSIGHTS_POOL.map((_, i) => (
                            <div key={i} className={`h-full rounded-full transition-all duration-500 flex-1 ${i === currentIndex ? 'bg-signal' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
