"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { ShieldCheck, Settings2, Bell, Link as LinkIcon, LockKeyhole, CheckCircle2, Sparkles } from "lucide-react"

export default function Settings() {
  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-5xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-foreground/60">This panel is intentionally configured for hackathon demo mode. It shows product configuration areas without exposing fake credentials or pretending to persist changes.</p>
            </div>

            <div className="glassmorphism rounded-lg p-6 border border-primary/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold mb-2">Demo Configuration Status</h2>
                  <p className="text-sm text-foreground/70">Authentication endpoints exist in the backend, but this page is currently a presentation-only settings surface. No fake API keys are shown and no settings are persisted from this UI.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glassmorphism rounded-lg p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <LockKeyhole className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Auth Endpoints</h2>
                </div>
                <div className="text-3xl font-bold mb-2">2</div>
                <p className="text-sm text-foreground/70">`/register` and `/login` are live in the backend and ready for future UI wiring.</p>
              </div>

              <div className="glassmorphism rounded-lg p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Security Mode</h2>
                </div>
                <div className="text-3xl font-bold mb-2">Demo</div>
                <p className="text-sm text-foreground/70">No fake credentials, no pretend persistence, and no misleading secret-management UI.</p>
              </div>

              <div className="glassmorphism rounded-lg p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Next Phase</h2>
                </div>
                <div className="text-3xl font-bold mb-2">API</div>
                <p className="text-sm text-foreground/70">The next iteration is wiring these controls to backend profile, alerting, and workspace settings.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glassmorphism rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Profile Settings</h2>
                </div>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="p-3 rounded border border-primary/10 bg-card/50">Default operator profile and organization branding are available for future persistence.</div>
                  <div className="p-3 rounded border border-primary/10 bg-card/50">Recommended next step: connect this page to the existing auth/user backend once post-demo hardening begins.</div>
                  <div className="p-3 rounded border border-primary/10 bg-card/50">Workspace-level branding and tenant metadata can be attached to generated PDF reports.</div>
                </div>
              </div>

              <div className="glassmorphism rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Notification Preferences</h2>
                </div>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="p-3 rounded border border-primary/10 bg-card/50">Critical vulnerability alerts</div>
                  <div className="p-3 rounded border border-primary/10 bg-card/50">Scan completion notifications</div>
                  <div className="p-3 rounded border border-primary/10 bg-card/50">API exposure warnings</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glassmorphism rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Security Preferences</h2>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="flex items-start gap-3 p-3 rounded border border-primary/10 bg-card/50">
                    <input type="checkbox" checked readOnly className="mt-1 accent-[var(--primary)]" />
                    <div>
                      <div className="font-semibold">Highlight critical findings</div>
                      <div className="text-foreground/60">Keeps high-priority issues visually elevated in the dashboard and report flows.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded border border-primary/10 bg-card/50">
                    <input type="checkbox" checked readOnly className="mt-1 accent-[var(--primary)]" />
                    <div>
                      <div className="font-semibold">Show remediation guidance</div>
                      <div className="text-foreground/60">Displays fix recommendations alongside confirmed findings for judge-friendly output.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glassmorphism rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Integration Roadmap</h2>
                </div>
                <div className="grid gap-4 text-sm">
                  <div className="p-4 rounded border border-primary/10 bg-card/50"><div className="font-semibold mb-1">Slack</div><div className="text-foreground/70">Planned for alert delivery and escalation workflows.</div></div>
                  <div className="p-4 rounded border border-primary/10 bg-card/50"><div className="font-semibold mb-1">Email</div><div className="text-foreground/70">Planned for PDF report delivery and scan notifications.</div></div>
                  <div className="p-4 rounded border border-primary/10 bg-card/50"><div className="font-semibold mb-1">GitHub</div><div className="text-foreground/70">Planned for issue creation from confirmed findings.</div></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
