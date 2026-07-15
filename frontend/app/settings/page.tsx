"use client"

import { Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import PageShell from "@/components/PageShell"
import { SectionCard, PrimaryButton } from "@/components/ui"

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const mockApiKey = "sk_test_51234567890abcdefghijklmnopqrst"

  const inputCls =
    "w-full h-11 px-4 rounded-xl bg-void/60 border border-line text-foreground text-sm focus:outline-none focus:border-signal/40"
  const iconBtn =
    "h-11 w-11 flex items-center justify-center rounded-xl border border-line text-muted hover:bg-white/5 transition"

  return (
    <PageShell
      kicker="Configuration"
      title="Settings"
      description="Manage your profile, API access, notifications, and security posture."
    >
      <div className="max-w-2xl space-y-8">
        <SectionCard title="Profile">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-muted mb-2">Email address</label>
              <input id="email" type="email" defaultValue="admin@civicshield.ai" className={inputCls} />
            </div>
            <div>
              <label htmlFor="org" className="block text-xs text-muted mb-2">Organization</label>
              <input id="org" type="text" defaultValue="My Organization" className={inputCls} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="API Access">
          <label className="block text-xs text-muted mb-2">API key</label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={mockApiKey}
              readOnly
              className={`${inputCls} flex-1 font-mono`}
            />
            <button onClick={() => setShowApiKey(!showApiKey)} className={iconBtn} aria-label="Toggle key visibility">
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => navigator.clipboard.writeText(mockApiKey)} className={iconBtn} aria-label="Copy key">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-faint mt-3">Keep your API key secret. Regenerate if compromised.</p>
          <button className="mt-4 px-4 py-2 rounded-lg border border-crit/30 text-crit text-sm hover:bg-crit/10 transition">
            Regenerate API key
          </button>
        </SectionCard>

        <SectionCard title="Notifications">
          <div className="space-y-3.5">
            {["Critical vulnerabilities", "Security alerts", "Scan completion", "API warnings"].map((pref) => (
              <label key={pref} className="flex items-center gap-3 cursor-pointer text-sm text-muted">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-signal" />
                {pref}
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Integrations">
          <div className="space-y-3">
            {[
              { name: "Slack", connected: true },
              { name: "Email Service", connected: false },
              { name: "GitHub", connected: false },
            ].map((int) => (
              <div key={int.name} className="flex items-center justify-between p-3.5 border border-line rounded-xl">
                <span className="font-medium text-sm text-foreground">{int.name}</span>
                <button
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    int.connected
                      ? "bg-signal/10 text-signal border border-signal/25 hover:bg-signal/15"
                      : "bg-white/5 text-muted hover:bg-white/10"
                  }`}
                >
                  {int.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Security">
          <div className="space-y-3.5">
            {["Enable two-factor authentication", "Require API key for all requests"].map((s) => (
              <label key={s} className="flex items-center gap-3 cursor-pointer text-sm text-muted">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-signal" />
                {s}
              </label>
            ))}
          </div>
          <PrimaryButton className="mt-6">Save settings</PrimaryButton>
        </SectionCard>
      </div>
    </PageShell>
  )
}
