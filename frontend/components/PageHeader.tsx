"use client"

import { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

interface PageHeaderProps {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-5"
    >
      <div className="max-w-2xl">
        {kicker && <span className="kicker">{kicker}</span>}
        <h1 className="display text-foreground text-[clamp(2.4rem,5.5vw,4.25rem)] mt-2">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-[15px] text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </motion.div>
  )
}
