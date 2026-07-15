"use client"

import { Search, Activity } from "lucide-react"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import PageShell from "@/components/PageShell"
import { SectionCard, EmptyState, SeverityBadge } from "@/components/ui"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ActivityLogsContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [threatType, setThreatType] = useState("All Types")
  const [severityFilter, setSeverityFilter] = useState("All Severity")

  const findings = scanData?.result?.findings || []

  const logs = useMemo(() => {
    return findings.map((f: any, i: number) => ({
      id: i + 1,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      type: f.vuln,
      severity: f.risk === "CRITICAL" ? "Critical" : f.risk === "HIGH" ? "High" : f.risk === "MEDIUM" ? "Medium" : "Low",
      ip: f.url?.split("/")[2] || "Unknown",
      description: `Triggered on '${f.param}' via ${f.payload || "unknown payload"}`,
    }))
  }, [findings])

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const matchSearch =
        searchTerm === "" ||
        log.ip.includes(searchTerm) ||
        log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchType = threatType === "All Types" || log.type.includes(threatType)
      const matchSeverity = severityFilter === "All Severity" || log.severity === severityFilter
      return matchSearch && matchType && matchSeverity
    })
  }, [logs, searchTerm, threatType, severityFilter])

  const uniqueThreatTypes = useMemo(() => Array.from(new Set(logs.map((l: any) => l.type))), [logs])

  const selectCls =
    "w-full h-11 px-4 rounded-xl bg-void/60 border border-line text-foreground text-sm focus:outline-none focus:border-signal/40"

  if (!scanId) {
    return (
      <EmptyState
        icon={Activity}
        title="No target acquired"
        description="Start a scan from the home page to stream its activity log."
        actionLabel="Go to Home"
        actionHref="/"
      />
    )
  }

  return (
    <>
      <SectionCard title="Filters">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search host, type, description…"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-void/60 border border-line text-foreground text-sm font-mono placeholder-faint focus:outline-none focus:border-signal/40"
            />
          </div>
          <select value={threatType} onChange={(e) => setThreatType(e.target.value)} className={selectCls}>
            <option>All Types</option>
            {uniqueThreatTypes.map((t: any) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectCls}>
            <option>All Severity</option>
            {["Critical", "High", "Medium", "Low"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Event Stream" aside={`${filteredLogs.length} events`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {["Timestamp", "Threat", "Severity", "Host", "Description"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left kicker font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-line hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5 font-mono text-xs text-faint whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3.5 font-semibold text-foreground text-xs whitespace-nowrap">{log.type}</td>
                  <td className="px-4 py-3.5"><SeverityBadge risk={log.severity} /></td>
                  <td className="px-4 py-3.5">
                    <code className="font-mono text-xs text-muted">{log.ip}</code>
                  </td>
                  <td className="px-4 py-3.5 text-muted text-xs break-all max-w-[360px]">{log.description}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-faint font-mono text-sm">
                    {scanData?.status === "completed" ? "// no events match the filters" : "// awaiting scan data…"}
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

export default function ActivityLogs() {
  return (
    <PageShell
      kicker="Telemetry"
      title="Activity Logs"
      description="A searchable, filterable stream of every finding the scan surfaced."
    >
      <ActivityLogsContent />
    </PageShell>
  )
}
