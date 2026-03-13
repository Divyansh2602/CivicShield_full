import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        warning: "var(--warning)",
        critical: "var(--critical)",
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(rgba(0, 245, 160, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 160, 0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}

export default config
