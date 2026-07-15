import type { Metadata } from "next"
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import CustomCursor from "@/components/CustomCursor"

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CivicShield AI — Offensive Security Intelligence",
  description:
    "AI-powered attack-surface mapping, vulnerability scanning, and phishing detection. Acquire a target, watch the systems come online.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="text-foreground">
        {/* Ambient atmosphere behind everything */}
        <div className="atmosphere" aria-hidden="true">
          <div className="atmosphere__aura" />
          <div className="atmosphere__noise" />
          <div className="atmosphere__vignette" />
        </div>

        <CustomCursor />

        <div className="app-shell">{children}</div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(12,17,25,0.92)",
              color: "var(--ink)",
              border: "1px solid var(--line-strong)",
              backdropFilter: "blur(12px)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  )
}
