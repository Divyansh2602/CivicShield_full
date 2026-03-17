"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Shield, BarChart3, Network, Mail, Lock, AlertTriangle, FileText, Activity, Settings, Menu, X } from "lucide-react"
import { useState, Suspense, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { name: "Vulnerability Scanner", path: "/scanner", icon: AlertTriangle },
  { name: "Attack Surface", path: "/surface", icon: Network },
  { name: "Phishing Detection", path: "/phishing", icon: Mail },
  { name: "API Security", path: "/api-security", icon: Lock },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Activity Logs", path: "/logs", icon: Activity },
  { name: "Settings", path: "/settings", icon: Settings },
]

function SidebarNavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scanId = searchParams.get("scanId")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, searchParams])

  const SidebarInner = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-primary/10 flex items-center justify-between">
        {(!collapsed || mobileOpen) && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary glow-text" />
            <span className="font-bold text-primary text-sm glow-text">CivicShield</span>
          </div>
        )}
        <button
          onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(!collapsed)}
          className="p-1 hover:bg-primary/10 rounded transition hidden md:block"
        >
          {collapsed ? "→" : "←"}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 hover:bg-primary/10 rounded transition md:hidden text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 space-y-2 px-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              href={scanId ? `${item.path}?scanId=${scanId}` : item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition hover-lift ${isActive
                  ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,245,160,0.1)]"
                  : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                }`}
              title={collapsed && !mobileOpen ? item.name : ""}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/10">
        <div className={`text-xs text-foreground/40 ${collapsed && !mobileOpen ? "text-center" : ""}`}>
          {(!collapsed || mobileOpen) ? <p>CivicShield AI v2.0</p> : <Shield className="w-4 h-4 mx-auto" />}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 border-b border-primary/10 bg-background/95 backdrop-blur z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-primary text-sm">CivicShield</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 bg-primary/10 rounded text-primary">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"} border-r border-primary/10 bg-card/50 backdrop-blur-md transition-all duration-300 flex flex-col hidden md:flex h-screen sticky top-0`}
      >
        <SidebarInner />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-64 border-r border-primary/10 bg-[#0f172a] shadow-2xl z-50 flex flex-col md:hidden"
            >
              <SidebarInner />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default function SidebarNav() {
  return (
    <Suspense fallback={<div className="w-64 border-r border-primary/10 bg-card/50 hidden md:flex" />}>
      <SidebarNavContent />
    </Suspense>
  )
}
