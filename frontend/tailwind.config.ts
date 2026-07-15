import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Literal hex so Tailwind's /opacity modifier works.
        // (:root CSS vars mirror these for direct var()/inline usage.)
        // Surfaces
        void: "#05070b",
        background: "#080b11",
        surface: "#0c1119",
        "surface-2": "#121926",
        card: "#0c1119",
        "card-foreground": "#eaf0f6",
        // Text
        foreground: "#eaf0f6",
        muted: "#9aa7b6",
        faint: "#5c6773",
        // Brand accent
        signal: "#3df5c4",
        "signal-deep": "#12b98c",
        primary: "#3df5c4",
        accent: "#3df5c4",
        // Secondary accent (info / secondary data)
        iris: "#8b8cff",
        "iris-deep": "#6366f1",
        // Severity ramp
        crit: "#ff5470",
        high: "#ff8f4d",
        med: "#ffcb4d",
        low: "#3df5c4",
        info: "#5aa2ff",
        warning: "#ff8f4d",
        critical: "#ff5470",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      letterSpacing: {
        widest2: "0.32em",
      },
      borderColor: {
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
      },
      boxShadow: {
        signal: "0 0 0 1px rgba(61,245,196,0.15), 0 20px 50px -24px rgba(61,245,196,0.35)",
        "signal-sm": "0 0 24px -6px rgba(61,245,196,0.4)",
        panel: "0 24px 60px -30px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        "signal-gradient": "linear-gradient(120deg, var(--signal), var(--signal-deep))",
        "iris-gradient": "linear-gradient(120deg, var(--iris), var(--iris-deep))",
        "cyber-grid":
          "linear-gradient(rgba(61,245,196,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(61,245,196,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.15", transform: "scale(1.25)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        sweep: "sweep 1.1s linear infinite",
        "pulse-ring": "pulse-ring 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

export default config
