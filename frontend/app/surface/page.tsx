"use client"

import { Globe, Server, Zap, Network } from "lucide-react"
import { useMemo, useRef, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import dynamic from "next/dynamic"
import PageShell from "@/components/PageShell"
import { SectionCard, StatTile, EmptyState, SeverityBadge } from "@/components/ui"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })
const fetcher = (url: string) => fetch(url).then((res) => res.json())

function AttackSurfaceContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")
  const graphRef = useRef<any>(null)

  // Measure the graph container so the force-graph canvas is responsive
  // (it takes explicit pixel width/height — a hardcoded width overflows/crops on mobile).
  const graphWrapRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ width: 800, height: 500 })
  useEffect(() => {
    const el = graphWrapRef.current
    if (!el) return
    const update = () =>
      setGraphSize({ width: el.clientWidth, height: el.clientHeight || 500 })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  // Derive the surface map from findings (group by URL, keep the highest risk).
  // Falls back to result.surface_map if the backend supplies one directly.
  const surfaceMap = useMemo(() => {
    const result = scanData?.result
    if (result?.surface_map) return result.surface_map
    const rank: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    const map: Record<string, { risk: string }> = {}
    for (const f of result?.findings || []) {
      if (!f.url) continue
      const risk = String(f.risk || "LOW").toUpperCase()
      if (!map[f.url] || (rank[risk] || 0) > (rank[map[f.url].risk] || 0)) {
        map[f.url] = { risk }
      }
    }
    return map
  }, [scanData])

  const nodes = useMemo(() => {
    return Object.entries(surfaceMap).map(([url, data]: any, i) => ({
      id: i + 1,
      label: url,
      type: url.includes("api") ? "api" : url.includes(".") ? "domain" : "endpoint",
      risk: data.risk,
      risky: data.risk === "HIGH" || data.risk === "CRITICAL",
    }))
  }, [surfaceMap])

  const graphData = useMemo(() => {
    const gNodes: any[] = [
      { id: 0, name: scanData?.result?.target || "Target", val: 26, color: "#8b8cff" },
    ]
    const gLinks: any[] = []
    nodes.forEach((node: any) => {
      gNodes.push({
        id: node.id,
        name: node.label,
        val: node.risky ? 15 : 10,
        color: node.risk === "CRITICAL" ? "#ff5470" : node.risk === "HIGH" ? "#ff8f4d" : "#3df5c4",
      })
      gLinks.push({ source: 0, target: node.id, color: "rgba(255,255,255,0.14)" })
    })
    return { nodes: gNodes, links: gLinks }
  }, [nodes, scanData])

  useEffect(() => {
    if (graphRef.current && nodes.length > 0) {
      graphRef.current.d3Force("charge").strength(-400)
      graphRef.current.d3Force("link").distance(150)
    }
  }, [graphData, nodes.length])

  const assets = {
    domains: nodes.filter((n) => n.type === "domain").length || 1,
    apis: nodes.filter((n) => n.type === "api").length,
    risky: nodes.filter((n) => n.risky).length,
  }

  if (!scanId) {
    return (
      <EmptyState
        icon={Network}
        title="No target acquired"
        description="Start a scan from the home page to map its attack surface."
        actionLabel="Go to Home"
        actionHref="/"
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatTile label="Domains discovered" value={assets.domains} icon={Globe} tone="signal" hint="Target + subdomains via recon" />
        <StatTile label="APIs exposed" value={assets.apis} icon={Server} tone="iris" hint="Active endpoints detected" />
        <StatTile label="High-risk assets" value={assets.risky} icon={Zap} tone="crit" hint="Require immediate attention" />
      </div>

      <SectionCard title="Attack Surface Map">
        <div ref={graphWrapRef} className="w-full h-[500px] rounded-xl overflow-hidden border border-line bg-void relative">
          {nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={graphSize.width}
              height={graphSize.height}
              backgroundColor="rgba(0,0,0,0)"
              nodeRelSize={6}
              linkColor="color"
              linkWidth={(node) => ((node as any).id === 0 ? 2 : 1)}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              cooldownTime={3000}
              warmupTicks={100}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.name
                const fontSize = (node.id === 0 ? 13 : 10) / globalScale
                const r = node.val / 2
                if (node.color === "#ff5470" || node.color === "#ff8f4d") {
                  ctx.shadowBlur = 18
                  ctx.shadowColor = node.color
                } else {
                  ctx.shadowBlur = 0
                }
                ctx.beginPath()
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false)
                ctx.fillStyle = node.color
                ctx.fill()
                ctx.shadowBlur = 0
                ctx.font = `${fontSize}px "JetBrains Mono", monospace`
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.lineWidth = 2 / globalScale
                ctx.strokeStyle = "#05070b"
                ctx.strokeText(label, node.x, node.y + r + 12 / globalScale)
                ctx.fillStyle = node.id === 0 ? "#eaf0f6" : "#9aa7b6"
                ctx.fillText(label, node.x, node.y + r + 12 / globalScale)
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-faint font-mono text-sm">
              {scanData?.status === "completed" ? "// no surface mapping data" : "// mapping in progress…"}
            </div>
          )}
        </div>
        <p className="text-xs text-faint mt-3 font-mono">
          Iris node = root target · red/orange = discovered vulnerabilities · mint = monitored.
        </p>
      </SectionCard>

      <SectionCard title="Discovered Assets" aside={`${nodes.length} assets`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {["Asset", "Type", "Risk", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left kicker font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b border-line hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5 font-mono text-xs text-muted break-all max-w-[320px]">{node.label}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-iris/10 text-iris border border-iris/25">
                      {node.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><SeverityBadge risk={node.risk || (node.risky ? "HIGH" : "LOW")} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-muted text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${node.risky ? "bg-crit" : "bg-signal"}`} />
                      {node.risky ? "At risk" : "Monitored"}
                    </div>
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-faint font-mono text-sm">
                    {scanData?.status === "completed" ? "// no assets discovered" : "// scanning in progress…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  )
}

export default function AttackSurface() {
  return (
    <PageShell
      kicker="Exposure"
      title="Attack Surface"
      description="Every reachable route, correlated and risk-tagged around your target."
    >
      <AttackSurfaceContent />
    </PageShell>
  )
}
