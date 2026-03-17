"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Search, Filter } from "lucide-react"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

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

  // Generate logs from findings
  const logs = useMemo(() => {
    return findings.map((f: any, i: number) => {
      // Approximate severity mapping
      const severity = f.risk === "CRITICAL" ? "Critical" : f.risk === "HIGH" ? "High" : f.risk === "MEDIUM" ? "Medium" : "Low"
      return {
        id: i + 1,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), // Using current time for simulation 
        type: f.vuln,
        severity: severity,
        ip: f.url.split('/')[2] || "Unknown", // Extracting host as "IP" for display
        description: `Triggered on '${f.param}' via ${f.payload || 'unknown payload'}`,
        fullUrl: f.url,
      }
    })
  }, [findings])

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const matchSearch = searchTerm === "" ||
        log.ip.includes(searchTerm) ||
        log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchType = threatType === "All Types" || log.type.includes(threatType)
      const matchSeverity = severityFilter === "All Severity" || log.severity === severityFilter

      return matchSearch && matchType && matchSeverity
    })
  }, [logs, searchTerm, threatType, severityFilter])

  const getSeverityColor = (severity: string) => {
    if (severity === "Critical") return "bg-critical/10 text-critical"
    if (severity === "High") return "bg-warning/10 text-warning"
    if (severity === "Medium") return "bg-primary/10 text-primary"
    return "bg-background/20 text-foreground/70"
  }

  // Extract unique threat types for the filter dropdown
  const uniqueThreatTypes = useMemo(() => {
    const types = new Set(logs.map((l: any) => l.type))
    return Array.from(types)
  }, [logs])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Activity Logs</h1>

          {!scanId ? (
            <div className="glassmorphism rounded-lg p-6 mb-8 border border-warning/30 flex items-center gap-3">
              <p className="text-warning">No scan ID detected. Please start a scan from the home page to view activity logs.</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="glassmorphism rounded-lg p-6 mb-8">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="search" className="block text-sm font-semibold mb-2">
                      Search Logs
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        id="search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by IP, type, or description..."
                        className="w-full pl-10 pr-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="threat-type" className="block text-sm font-semibold mb-2">
                      Threat Type
                    </label>
                    <select
                      id="threat-type"
                      value={threatType}
                      onChange={(e) => setThreatType(e.target.value)}
                      className="w-full px-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                    >
                      <option value="All Types">All Types</option>
                      {uniqueThreatTypes.map((type: any) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="severity-filter" className="block text-sm font-semibold mb-2">
                      Severity Filter
                    </label>
                    <select
                      id="severity-filter"
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                    >
                      <option value="All Severity">All Severity</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="glassmorphism rounded-lg p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Timestamp</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Threat Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Severity</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Target Host</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/60">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-primary/5 hover:bg-primary/5 transition">
                          <td className="px-4 py-3 text-sm text-foreground/70 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">{log.type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-background/50 px-2 py-1 rounded">
                              {log.ip}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-foreground/70 break-all">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                            {scanData?.status === "completed" ? "No activity logs found matching the filters." : "Scanning in progress or awaiting data..."}
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

export default function ActivityLogs() {
  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <Suspense fallback={<div className="flex-1" />}>
        <ActivityLogsContent />
      </Suspense>
    </div>
  )
}
