"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Shield, BarChart3, Network, Mail, Lock, AlertTriangle, FileText, Activity, Settings, Menu, X, ChevronLeft } from "lucide-react"
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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, searchParams])

  const SidebarInner = ({ mobile = false }: { mobile?: boolean }) => {
    const showLabels = !collapsed || mobile
    return (
      <>
        {/* Header */}
        <div className="h-16 px-4 border-b border-line flex items-center justify-between">
          {showLabels && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/25 flex items-center justify-center">
                <Shield className="w-4 h-4 text-signal" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">CivicShield</span>
            </Link>
          )}
          {mobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition text-muted"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition text-muted hidden md:block"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path || pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                href={scanId ? `${item.path}?scanId=${scanId}` : item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? "bg-signal/10 text-signal"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
                title={collapsed && !mobile ? item.name : ""}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-signal" />
                )}
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {showLabels && <span className="text-[13px] font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-line">
          <div className={`font-mono text-[10px] text-faint ${collapsed && !mobile ? "text-center" : ""}`}>
            {showLabels ? <p>CIVICSHIELD · v2.0</p> : <Shield className="w-4 h-4 mx-auto" />}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 border-b border-line bg-surface/90 backdrop-blur-xl z-40 flex items-center px-4 justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/25 flex items-center justify-center">
            <Shield className="w-4 h-4 text-signal" />
          </div>
          <span className="font-semibold text-sm text-foreground">CivicShield</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 bg-white/5 rounded-lg text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`${collapsed ? "w-[76px]" : "w-64"} border-r border-line bg-surface/60 backdrop-blur-xl transition-all duration-300 flex-col hidden md:flex h-screen sticky top-0`}
      >
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-void/70 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-64 border-r border-line bg-surface shadow-panel z-50 flex flex-col md:hidden"
            >
              <SidebarInner mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default function SidebarNav() {
  return (
    <Suspense fallback={<div className="w-64 border-r border-line bg-surface/60 hidden md:flex" />}>
      <SidebarNavContent />
    </Suspense>
  )
}
