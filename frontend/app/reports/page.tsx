"use client"

import { Download, FileText, Calendar } from "lucide-react"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import PageShell from "@/components/PageShell"
import { SectionCard, EmptyState, PrimaryButton, SeverityBadge } from "@/components/ui"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ReportsContent() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")

  const { data: scanData } = useSWR(
    scanId ? `/api/scan/${scanId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const handleDownload = (id: string) => window.open(`/api/report/${id}`, "_blank")

  const report = useMemo(() => {
    if (!scanId || !scanData?.result) return null
    const findings = scanData.result.findings || []
    return {
      id: scanId,
      name: `${scanData.result.target || "Scan"} — Security Report`,
      date: new Date().toISOString().split("T")[0],
      vulnerabilities: findings.length,
      critical: findings.filter((f: any) => f.risk === "CRITICAL").length,
      high: findings.filter((f: any) => f.risk === "HIGH").length,
      completed: scanData.status === "completed",
    }
  }, [scanData, scanId])

  if (!scanId) {
    return (
      <EmptyState
        icon={FileText}
        title="No target acquired"
        description="Start a scan from the home page to generate an audit-ready report."
        actionLabel="Go to Home"
        actionHref="/"
      />
    )
  }

  return (
    <>
      <SectionCard title="Current Scan">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="kicker mb-1.5">Target</p>
            <p className="font-mono text-signal text-sm break-all">
              {scanData?.result?.target || "Loading…"}
            </p>
          </div>
          <PrimaryButton
            onClick={() => handleDownload(scanId)}
            disabled={!report?.completed}
            className="h-11"
          >
            <Download className="w-4 h-4" />
            {report?.completed ? "Download PDF report" : "Scan in progress…"}
          </PrimaryButton>
        </div>
        {!report?.completed && (
          <p className="text-xs text-faint mt-3 font-mono">
            Reports can be downloaded once the scan completes.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Recent Reports">
        {report ? (
          <div className="border border-line rounded-xl p-5 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-signal" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{report.name}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.date}
                  </span>
                  <span className="font-mono">{report.vulnerabilities} findings</span>
                  {report.critical > 0 && <SeverityBadge risk="critical" />}
                  {report.high > 0 && <SeverityBadge risk="high" />}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDownload(report.id)}
              disabled={!report.completed}
              className="px-4 py-2 rounded-lg bg-signal/10 text-signal border border-signal/20 text-sm hover:bg-signal/15 transition flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ) : (
          <p className="text-center text-faint font-mono text-sm py-8">{"// no reports yet"}</p>
        )}
      </SectionCard>
    </>
  )
}

export default function Reports() {
  return (
    <PageShell
      kicker="Deliverables"
      title="Security Reports"
      description="Generate and download executive, audit-ready PDF reports for any scan."
    >
      <ReportsContent />
    </PageShell>
  )
}
