"use client"

import { useEffect, useRef } from "react"

/**
 * Crosshair custom cursor. Desktop + fine-pointer only.
 * Fully disabled when the user prefers reduced motion or is on a
 * touch/coarse-pointer device. Augments interactivity; never traps focus.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!finePointer || reduced) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    document.body.classList.add("has-custom-cursor")

    // Stay hidden until the pointer first moves, so nothing parks at (0,0).
    dot.style.opacity = "0"
    ring.style.opacity = "0"
    let seen = false

    let ringX = 0
    let ringY = 0
    let mouseX = 0
    let mouseY = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!seen) {
        seen = true
        ringX = mouseX
        ringY = mouseY
        dot.style.opacity = "1"
        ring.style.opacity = "1"
      }
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`

      const target = e.target as HTMLElement | null
      const interactive = !!target?.closest(
        "a, button, input, textarea, select, [role='button'], .magnetic"
      )
      ring.classList.toggle("is-hot", interactive)
    }

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    const onLeave = () => {
      dot.style.opacity = "0"
      ring.style.opacity = "0"
    }
    const onEnter = () => {
      dot.style.opacity = "1"
      ring.style.opacity = "1"
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseleave", onLeave)
    window.addEventListener("mouseenter", onEnter)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("mouseenter", onEnter)
      cancelAnimationFrame(raf)
      document.body.classList.remove("has-custom-cursor")
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
