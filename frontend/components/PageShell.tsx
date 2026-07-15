"use client"

import { ReactNode, Suspense } from "react"
import SidebarNav from "@/components/SidebarNav"
import DashboardHeader from "@/components/DashboardHeader"
import PageHeader from "@/components/PageHeader"

interface PageShellProps {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * The one shell every app page uses: sidebar + header + a generously spaced
 * container with an editorial page header. Keeps the whole product cohesive.
 */
export default function PageShell({
  kicker,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="flex h-screen text-foreground">
      <SidebarNav />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="page-container">
            <Suspense fallback={null}>
              <PageHeader
                kicker={kicker}
                title={title}
                description={description}
                actions={actions}
              />
              <div className="mt-10 space-y-8">{children}</div>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
