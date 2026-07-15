"use client"

import { Search, Bell, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DashboardHeader() {
  const [notificationCount] = useState(3)

  return (
    <header className="border-b border-line bg-surface/60 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Search */}
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input
              type="text"
              placeholder="Search logs, targets, findings…"
              className="w-full h-10 pl-10 pr-4 bg-void/50 border border-line rounded-lg text-foreground text-sm font-mono placeholder-faint focus:outline-none focus:border-signal/40 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-4">
          <button
            className="relative p-2.5 hover:bg-white/5 rounded-lg transition text-muted"
            onClick={() => alert("No new notifications")}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-crit rounded-full ring-2 ring-surface" />
            )}
          </button>

          <Link
            href="/settings"
            className="p-2.5 hover:bg-white/5 rounded-lg transition text-muted"
            aria-label="Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>

          <button
            className="p-2.5 hover:bg-white/5 rounded-lg transition text-muted"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>

          <div className="ml-2 w-9 h-9 rounded-full bg-signal-gradient flex items-center justify-center text-void font-semibold text-sm">
            DG
          </div>
        </div>
      </div>
    </header>
  )
}
