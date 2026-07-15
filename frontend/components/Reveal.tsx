"use client"

import { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger index — multiplies the base delay for sequenced reveals. */
  delay?: number
  /** Distance travelled on entry (px). */
  y?: number
  as?: "div" | "section" | "li" | "span"
}

/**
 * Scroll-triggered reveal. Fades + rises into place once when it enters the
 * viewport. Collapses to an instant, static render under reduced-motion.
 */
export default function Reveal({ children, className, delay = 0, y = 20, as = "div" }: RevealProps) {
  const reduced = useReducedMotion()

  const variants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0 : 0.7,
        delay: reduced ? 0 : delay * 0.08,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }

  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </MotionTag>
  )
}
