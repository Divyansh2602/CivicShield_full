"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Severity → tone map. Hex literals (not css vars) so `${tone}14` alpha
// concatenation is valid CSS. Mirrors the design tokens.
// ---------------------------------------------------------------------------
const SEVERITY_TONE: Record<string, string> = {
  critical: "#ff5470",
  high: "#ff8f4d",
  medium: "#ffcb4d",
  low: "#3df5c4",
  info: "#8b8cff",
}

export function toneForRisk(risk?: string): string {
  return SEVERITY_TONE[(risk || "").toLowerCase()] || "#9aa7b6"
}

export function SeverityBadge({ risk }: { risk?: string }) {
  const tone = toneForRisk(risk)
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ color: tone, background: `${tone}1a`, border: `1px solid ${tone}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
      {(risk || "unknown").toUpperCase()}
    </span>
  )
}

// ---------------------------------------------------------------------------
// StatTile — metric summary card
// ---------------------------------------------------------------------------
interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: "signal" | "crit" | "high" | "med" | "iris" | "muted"
}

const TONE_VAR: Record<NonNullable<StatTileProps["tone"]>, string> = {
  signal: "#3df5c4",
  crit: "#ff5470",
  high: "#ff8f4d",
  med: "#ffcb4d",
  iris: "#8b8cff",
  muted: "#eaf0f6",
}

export function StatTile({ label, value, hint, icon: Icon, tone = "signal" }: StatTileProps) {
  const color = TONE_VAR[tone]
  return (
    <div className="panel hover-lift p-6 relative overflow-hidden group">
      <div
        className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-4 relative">
        <span className="kicker">{label}</span>
        {Icon && <Icon className="w-[18px] h-[18px]" style={{ color }} />}
      </div>
      <div className="font-mono text-4xl font-semibold tabular-nums relative" style={{ color }}>
        {value}
      </div>
      {hint && <p className="text-xs text-muted mt-2 relative">{hint}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SectionCard — panel with an optional kicker header + hairline rule
// ---------------------------------------------------------------------------
interface SectionCardProps {
  title?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}

export function SectionCard({ title, aside, children, className = "", padded = true }: SectionCardProps) {
  return (
    <section className={`panel ${padded ? "p-6" : ""} ${className}`}>
      {title && (
        <div className="section-rule">
          <span className="kicker">{title}</span>
          {aside && <span className="font-mono text-[11px] text-faint">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// EmptyState — premium prompt for no-data / no-scan contexts
// ---------------------------------------------------------------------------
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="panel px-6 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-signal/10 border border-signal/25 flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-signal" />
      </div>
      <h3 className="display text-3xl text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted max-w-md">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 px-5 py-2.5 rounded-xl bg-signal-gradient text-void font-semibold text-sm hover:brightness-110 transition shadow-signal-sm"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons — consistent primary / ghost
// ---------------------------------------------------------------------------
export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-signal-gradient text-void font-semibold text-sm hover:brightness-110 transition shadow-signal-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-line-strong text-foreground font-medium text-sm hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
