"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ShieldAlert, Cpu, Activity, AlertTriangle, ShieldCheck } from 'lucide-react'

// Simulated AI Insight Feed Pool
const INSIGHTS_POOL = [
    {
        type: "critical",
        icon: <ShieldAlert className="w-5 h-5 text-critical" />,
        message: "Repeated SQL injection attempts detected targeting login API from multiple IP addresses."
    },
    {
        type: "warning",
        icon: <AlertTriangle className="w-5 h-5 text-warning" />,
        message: "Anomalous data exfiltration patterns observed on `/api/v1/users/export`. Rate limiting recommended."
    },
    {
        type: "info",
        icon: <Cpu className="w-5 h-5 text-primary" />,
        message: "Machine Learning heuristic signature matches new zero-day mutation payload on admin portal."
    },
    {
        type: "success",
        icon: <ShieldCheck className="w-5 h-5 text-[#00f5a0]" />,
        message: "Automated WAF rules successfully blocked 43 malicious crawler bots in the last 15 minutes."
    },
    {
        type: "critical",
        icon: <Activity className="w-5 h-5 text-critical" />,
        message: "High-frequency credential stuffing attack detected against primary authentication gateway."
    }
]

export default function AIThreatInsights() {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Rotate through insights every 8 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % INSIGHTS_POOL.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="glassmorphism rounded-lg p-6 mb-8 relative overflow-hidden group">

            {/* Animated AI Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />

            <div className="flex items-start md:items-center flex-col md:flex-row gap-6 relative z-10">

                {/* Core AI Orb */}
                <div className="flex-shrink-0 relative flex items-center justify-center">
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse" />

                    {/* Center Brain Icon */}
                    <div className="relative w-16 h-16 rounded-full bg-background border border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.3)]">
                        <Brain className="w-8 h-8 text-primary" />
                    </div>
                </div>

                {/* Messaging Content */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                            AI Threat Insights
                        </h2>
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest border border-primary/30">
                            Live Analysis
                        </div>
                    </div>

                    {/* Animated Message Container */}
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
                                <div className="flex-shrink-0 mt-0.5">
                                    {INSIGHTS_POOL[currentIndex].icon}
                                </div>
                                <p className="text-sm md:text-base text-foreground/90 font-mono leading-relaxed">
                                    {INSIGHTS_POOL[currentIndex].message}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="mt-3 flex gap-1 h-1">
                        {INSIGHTS_POOL.map((_, i) => (
                            <div key={i} className={`h-full rounded-full transition-all duration-500 flex-1 ${i === currentIndex ? 'bg-primary' : 'bg-primary/20'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
