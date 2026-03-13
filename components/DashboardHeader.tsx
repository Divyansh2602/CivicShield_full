"use client"

import { Shield, Search, Bell, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DashboardHeader() {
  const [notificationCount] = useState(3)

  return (
    <header className="border-b border-primary/10 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary hidden md:inline">CivicShield AI</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-primary/20 rounded-lg text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-primary/10 rounded-lg transition"
            onClick={() => alert("No new notifications")}
          >
            <Bell className="w-5 h-5 text-foreground/60" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full" />
            )}
          </button>

          {/* Settings */}
          <Link href="/settings" className="p-2 hover:bg-primary/10 rounded-lg transition">
            <Settings className="w-5 h-5 text-foreground/60" />
          </Link>

          {/* Logout */}
          <button className="p-2 hover:bg-primary/10 rounded-lg transition" title="Logout">
            <LogOut className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
      </div>
    </header>
  )
}
