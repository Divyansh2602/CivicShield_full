"use client"

import DashboardHeader from "@/components/DashboardHeader"
import SidebarNav from "@/components/SidebarNav"
import { Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const mockApiKey = "sk_test_51234567890abcdefghijklmnopqrst"

  return (
    <div className="flex h-screen bg-transparent text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            {/* Profile Settings */}
            <div className="glassmorphism rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    defaultValue="admin@civicshield.ai"
                    className="w-full px-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Organization Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    defaultValue="My Organization"
                    className="w-full px-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* API Key Management */}
            <div className="glassmorphism rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">API Key Management</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={mockApiKey}
                      readOnly
                      className="flex-1 px-4 py-2 bg-card border border-primary/20 rounded-lg text-foreground focus:outline-none"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/10 transition flex items-center gap-2"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mockApiKey)
                      }}
                      className="px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/10 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/50 mt-2">
                    Keep your API key secure. Regenerate if you suspect it&apos;s been compromised.
                  </p>
                </div>
                <button className="px-4 py-2 border border-critical/30 text-critical rounded hover:bg-critical/10 transition">
                  Regenerate API Key
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="glassmorphism rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  "Critical Vulnerabilities",
                  "Security Alerts",
                  "Scan Completion",
                  "API Warnings",
                ].map((pref, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-foreground/80">{pref}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* System Integrations */}
            <div className="glassmorphism rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">System Integrations</h2>
              <div className="space-y-4">
                {[
                  { name: "Slack", status: "Connected" },
                  { name: "Email Service", status: "Not Connected" },
                  { name: "GitHub", status: "Not Connected" },
                ].map((integration, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-primary/10 rounded-lg">
                    <span className="font-semibold">{integration.name}</span>
                    <button
                      className={`px-4 py-1 rounded text-sm font-bold ${
                        integration.status === "Connected"
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-foreground/10 text-foreground/60 hover:bg-foreground/20"
                      } transition`}
                    >
                      {integration.status === "Connected" ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div className="glassmorphism rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Security Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-foreground/80">Enable Two-Factor Authentication</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-foreground/80">Require API Key for all requests</span>
                </label>
              </div>
              <button className="mt-6 px-6 py-2 bg-primary text-background font-bold rounded hover:bg-primary/90 transition">
                Save Settings
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
