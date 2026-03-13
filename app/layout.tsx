import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CivicShield AI - Enterprise Cybersecurity Platform",
  description: "AI-powered vulnerability detection and attack surface analysis for enterprise security",
}

import { Toaster } from 'react-hot-toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#121826',
              color: '#e0e0e0',
              border: '1px solid rgba(0, 245, 160, 0.2)'
            }
          }}
        />
      </body>
    </html>
  )
}
