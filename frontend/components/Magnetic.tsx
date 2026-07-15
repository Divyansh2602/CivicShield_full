"use client"

import { useRef, ReactNode } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

interface MagneticProps {
  children: ReactNode
  className?: string
  /** How far the element drifts toward the cursor (px of pull strength). */
  strength?: number
}

/**
 * Wraps an element so it drifts toward the cursor while hovered, then
 * springs back. Disabled under reduced-motion or coarse pointers.
 */
export default function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(relX * strength)
    y.set(relY * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: reduced ? 0 : sx, y: reduced ? 0 : sy }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
