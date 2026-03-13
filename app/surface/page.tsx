"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Globe, Server, Lock, Zap } from "lucide-react"

import { Suspense, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import dynamic from "next/dynamic"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

const fetcher = (url: string) => fetch(url).then(res => res.json())

function AttackSurfaceContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")
  const graphRef = useRef<any>(null)

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const surfaceMap = scanData?.result?.surface_map || {}

  const nodes = useMemo(() => {
    return Object.entries(surfaceMap).map(([url, data]: any, i) => ({
      id: i + 1,
      label: url,
      type: url.includes("api") ? "api" : url.includes(".") ? "domain" : "endpoint",
      risk: data.risk,
      risky: data.risk === "HIGH" || data.risk === "CRITICAL"
    }))
  }, [surfaceMap])

  const graphData = useMemo(() => {
    const gNodes: any[] = [{ id: 0, name: scanData?.result?.target || "Target Node", val: 25, color: "#3b82f6" }];
    const gLinks: any[] = [];

    nodes.forEach((node: any) => {
      gNodes.push({
        id: node.id,
        name: node.label,
        val: node.risky ? 15 : 10,
        color: node.risk === "CRITICAL" ? "#ef4444" : node.risk === "HIGH" ? "#f59e0b" : "#10b981"
      });
      gLinks.push({
        source: 0,
        target: node.id,
        color: "rgba(255, 255, 255, 0.2)"
      });
    });

    return { nodes: gNodes, links: gLinks };
  }, [nodes, scanData]);

  useEffect(() => {
    if (graphRef.current && nodes.length > 0) {
      // Access underlying d3 simulation to push nodes further apart
      graphRef.current.d3Force('charge').strength(-400); // Stronger repulsion entirely
      graphRef.current.d3Force('link').distance(150);    // Make links much longer
    }
  }, [graphData]);

  const assets = {
    domains: nodes.filter(n => n.type === "domain").length || 1,
    subdomains: 0,
    apis: nodes.filter(n => n.type === "api").length,
    servers: 1,
    ports: 2,
    risky: nodes.filter(n => n.risky).length,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Attack Surface Analysis</h1>

          {!scanId ? (
            <div className="glassmorphism rounded-lg p-6 mb-8 border border-warning/30 flex items-center gap-3">
              <p className="text-warning">No scan ID detected. Please start a scan from the home page to view assets.</p>
            </div>
          ) : (
            <>
              {/* Asset Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="glassmorphism rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                    <span className="text-foreground/60 font-semibold">Domains Discovered</span>
                  </div>
                  <div className="text-3xl font-bold">{assets.domains}</div>
                  <p className="text-sm text-foreground/60 mt-2">Target and subdomains via recon</p>
                </div>

                <div className="glassmorphism rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-primary" />
                    <span className="text-foreground/60 font-semibold">APIs Exposed</span>
                  </div>
                  <div className="text-3xl font-bold">{assets.apis}</div>
                  <p className="text-sm text-foreground/60 mt-2">Active endpoints detected</p>
                </div>

                <div className="glassmorphism rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-critical" />
                    <span className="text-foreground/60 font-semibold">High-Risk Assets</span>
                  </div>
                  <div className="text-3xl font-bold text-critical">{assets.risky}</div>
                  <p className="text-sm text-foreground/60 mt-2">Require immediate attention</p>
                </div>
              </div>

              {/* Attack Surface Map */}
              <div className="glassmorphism rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Attack Surface Map</h2>
                <div className="w-full h-[500px] bg-[#0f172a] rounded-lg overflow-hidden border border-primary/20 relative">
                  {nodes.length > 0 ? (
                    <ForceGraph2D
                      ref={graphRef}
                      graphData={graphData}
                      width={1000}
                      height={500}
                      backgroundColor="#0f172a"
                      nodeRelSize={6}
                      linkColor="color"
                      linkWidth={node => (node as any).id === 0 ? 2 : 1}
                      linkDirectionalParticles={2}
                      linkDirectionalParticleSpeed={0.005}
                      cooldownTime={3000}
                      warmupTicks={100}
                      onEngineTick={() => { }}
                      nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = node.id === 0 ? 14 / globalScale : 10 / globalScale;
                        const r = node.val / 2;

                        // Glowing effect for risky nodes
                        if (node.color === "#ef4444" || node.color === "#f59e0b") {
                          ctx.shadowBlur = 20;
                          ctx.shadowColor = node.color;
                        } else {
                          ctx.shadowBlur = 0;
                        }

                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color;
                        ctx.fill();

                        // Reset shadow for text
                        ctx.shadowBlur = 0;

                        ctx.font = `${fontSize}px Inter, Sans-Serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        // Draw black outline for text readability
                        ctx.lineWidth = 2 / globalScale;
                        ctx.strokeStyle = '#0f172a';
                        ctx.strokeText(label, node.x, node.y + r + (12 / globalScale));

                        ctx.fillStyle = node.id === 0 ? '#ffffff' : '#e2e8f0';
                        ctx.fillText(label, node.x, node.y + r + (12 / globalScale));
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-foreground/40">
                      <div className="text-center">
                        <div className="mb-4">No surface mapping data available</div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-foreground/50 mt-3">
                  Interactive threat map: Red/Orange nodes indicate discovered vulnerabilities. Blue is the root domain.
                </p>
              </div>

              {/* Discovered Assets */}
              <div className="glassmorphism rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Discovered Assets</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Asset Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Risk Level</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map((node) => (
                        <tr key={node.id} className="border-b border-primary/5 hover:bg-primary/5 transition">
                          <td className="px-4 py-3 font-mono text-xs break-all">{node.label}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs uppercase">
                              {node.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${node.risky
                                ? "bg-critical/10 text-critical"
                                : "bg-primary/10 text-primary"
                                }`}
                            >
                              {node.risk || (node.risky ? "HIGH" : "LOW")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${node.risky ? "bg-critical" : "bg-primary"
                                  }`}
                              />
                              <span className="text-foreground/60">
                                {node.risky ? "At Risk" : "Monitored"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {nodes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-foreground/50">
                            {scanData?.status === "completed" ? "No assets discovered." : "Scanning in progress..."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function AttackSurface() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <AttackSurfaceContent />
      </Suspense>
    </div>
  )
}
