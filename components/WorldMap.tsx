"use client"

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react'

// Simple SVG path data for a world map outline (Low-Resolution generic version)
// Using an ultra-simplified SVG path to keep the file size minimal while maintaining the aesthetic
const WORLD_MAP_PATH = "M 103 40 C 97 32, 92 63, 137 60 C 182 57, 182 25, 230 20 C 278 15, 240 79, 274 74 C 308 69, 279 84, 303 103 C 327 122, 340 181, 319 220 C 298 259, 237 289, 219 270 C 201 251, 163 214, 137 200 C 111 186, 126 122, 103 100 C 80 78, 93 118, 59 133 C 25 148, 20 200, 39 230 C 58 260, 114 270, 77 301 C 40 332, 40 270, 19 260 C -2 250, -13 221, -2 201 C 9 181, -4 148, 17 122 C 38 96, 60 70, 103 40 Z"

// Base coordinate system mapping relative to the SVG viewbox (0,0 to 800,400)
const LOCATIONS: Record<string, { x: number, y: number, name: string }> = {
    "USA": { x: 180, y: 150, name: "United States" },
    "China": { x: 620, y: 170, name: "China" },
    "Russia": { x: 550, y: 100, name: "Russia" },
    "India": { x: 580, y: 210, name: "India" },
    "Germany": { x: 420, y: 130, name: "Germany" },
    "UK": { x: 390, y: 120, name: "United Kingdom" },
    "Brazil": { x: 260, y: 280, name: "Brazil" },
    "Australia": { x: 680, y: 320, name: "Australia" },
}

const ATTACKS = [
    { from: "Russia", to: "India", type: "CRITICAL" },
    { from: "China", to: "USA", type: "HIGH" },
    { from: "Germany", to: "UK", type: "MEDIUM" },
    { from: "Brazil", to: "USA", type: "MEDIUM" },
    { from: "Russia", to: "Germany", type: "HIGH" },
]

export default function CyberAttackMap() {
    // Generate SVG arcs for each attack
    const attackArcs = useMemo(() => {
        return ATTACKS.map((attack, i) => {
            const source = LOCATIONS[attack.from]
            const target = LOCATIONS[attack.to]

            // Calculate a slight curve for the attack path
            const midX = (source.x + target.x) / 2
            const midY = (source.y + target.y) / 2 - 50 // Curve upwards

            const path = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`

            let colorElement = "text-primary"
            let strokeColor = "rgba(0, 245, 160, 0.6)"

            if (attack.type === "CRITICAL") {
                colorElement = "text-critical"
                strokeColor = "rgba(239, 68, 68, 0.8)"
            } else if (attack.type === "HIGH") {
                colorElement = "text-warning"
                strokeColor = "rgba(245, 158, 11, 0.8)"
            }

            return {
                id: i,
                ...attack,
                source,
                target,
                path,
                colorElement,
                strokeColor
            }
        })
    }, [])

    return (
        <div className="glassmorphism rounded-lg p-6 mb-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold">Global Cyber Threat Map</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                            Simulation Mode
                        </span>
                    </div>
                    <p className="text-sm text-foreground/60">Real-time visualization of active threat intelligence intercepts (Demonstrative UI)</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-critical shadow-[0_0_8px_#ef4444]" />
                        <span>Critical</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_#f59e0b]" />
                        <span>High</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00f5a0]" />
                        <span>Monitor</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-[400px] bg-[#0A0F1A] rounded-lg border border-primary/10 relative overflow-hidden flex items-center justify-center">
                {/* Map Background grid */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(0, 245, 160, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 160, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                <svg viewBox="0 0 800 400" className="w-full h-full z-10">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                    </defs>

                    {/* Abstract World Map Silhouette */}
                    <path
                        // Using a highly stylized, abstract tech-map SVG path (represented by simple rects/circles to simulate a dot matrix map if we don't have a giant real GeoJSON)
                        d="M100 80h10v10h-10z M115 80h10v10h-10z M100 95h10v10h-10z M130 70h10v10h-10z M145 70h10v10h-10z M160 85h10v10h-10z M175 85h10v10h-10z M190 100h10v10h-10z M140 110h10v10h-10z M155 110h10v10h-10z M170 115h10v10h-10z M185 120h10v10h-10z M200 120h10v10h-10z M215 130h10v10h-10z M190 145h10v10h-10z M175 145h10v10h-10z M160 145h10v10h-10z M145 130h10v10h-10z M130 130h10v10h-10z M115 115h10v10h-10z M380 90h10v10h-10z M395 100h10v10h-10z M410 100h10v10h-10z M425 110h10v10h-10z M440 120h10v10h-10z M400 120h10v10h-10z M385 110h10v10h-10z M500 70h10v10h-10z M515 70h10v10h-10z M530 60h10v10h-10z M545 60h10v10h-10z M560 60h10v10h-10z M575 70h10v10h-10z M590 70h10v10h-10z M605 85h10v10h-10z M620 100h10v10h-10z M635 110h10v10h-10z M650 120h10v10h-10z M665 130h10v10h-10z M650 145h10v10h-10z M635 145h10v10h-10z M620 130h10v10h-10z M605 130h10v10h-10z M590 115h10v10h-10z M575 115h10v10h-10z M560 115h10v10h-10z M545 100h10v10h-10z M530 100h10v10h-10z M560 180h10v10h-10z M575 190h10v10h-10z M590 200h10v10h-10z M605 210h10v10h-10z M590 220h10v10h-10z M575 220h10v10h-10z M560 210h10v10h-10z M210 240h10v10h-10z M225 250h10v10h-10z M240 260h10v10h-10z M255 270h10v10h-10z M270 280h10v10h-10z M255 290h10v10h-10z M240 290h10v10h-10z M225 280h10v10h-10z M210 270h10v10h-10z M650 280h10v10h-10z M665 290h10v10h-10z M680 300h10v10h-10z M695 310h10v10h-10z M710 320h10v10h-10z M695 330h10v10h-10z M680 330h10v10h-10z M665 320h10v10h-10z M650 310h10v10h-10z"
                        fill="rgba(30, 41, 59, 0.6)"
                        stroke="rgba(51, 65, 85, 0.4)"
                        strokeWidth="1"
                    />

                    {/* Locations and Pulses */}
                    {Object.entries(LOCATIONS).map(([key, loc]) => (
                        <g key={key}>
                            <circle cx={loc.x} cy={loc.y} r="3" fill="#334155" />
                            <text x={loc.x} y={loc.y + 15} fontSize="10" fill="#64748b" textAnchor="middle" className="font-mono">
                                {key}
                            </text>
                        </g>
                    ))}

                    {/* Attack Arcs */}
                    {attackArcs.map((arc) => (
                        <g key={arc.id}>
                            {/* Base faded line */}
                            <path
                                d={arc.path}
                                fill="none"
                                stroke={arc.strokeColor}
                                strokeWidth="1"
                                strokeOpacity="0.3"
                            />

                            {/* Glowing animated line */}
                            <motion.path
                                d={arc.path}
                                fill="none"
                                stroke={arc.strokeColor}
                                strokeWidth="2"
                                filter="url(#glow)"
                                strokeDasharray="0 1"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: [0, 1, 1],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: arc.id * 0.8 // stagger animations
                                }}
                            />

                            {/* Origin pulse */}
                            <motion.circle
                                cx={arc.source.x}
                                cy={arc.source.y}
                                r="4"
                                fill={arc.strokeColor}
                                filter="url(#glow)"
                                animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />

                            {/* Destination impact */}
                            <motion.circle
                                cx={arc.target.x}
                                cy={arc.target.y}
                                r="3"
                                fill={arc.strokeColor}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: (arc.id * 0.8) + 1.2
                                }}
                            />
                        </g>
                    ))}
                </svg>

                {/* Live Event Log Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md rounded border border-primary/20 p-3 flex items-center gap-4 overflow-hidden">
                    <div className="flex items-center gap-2 text-primary whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-critical animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live Intercepts</span>
                    </div>

                    <div className="flex-1 overflow-hidden relative h-5">
                        <motion.div
                            className="absolute whitespace-nowrap text-xs font-mono text-foreground/80"
                            animate={{ x: ["100%", "-100%"] }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        >
                            [DETECTED] High-velocity SQLi payload originating from Russia targeting DB-04 ...
                            [ALERT] Brute force login spike originating from China against Auth Proxy ...
                            [WARN] Suspicious internal scan activity detected from Germany subnet ...
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
