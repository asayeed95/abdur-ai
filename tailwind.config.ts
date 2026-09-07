import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clay edition palette — locked from the design bundle.
        // Channel values live in app/globals.css (:root and
        // :root[data-theme="light"]). The `<alpha-value>` placeholder keeps
        // opacity utilities working: border-clay/40 -> rgb(var(--c-clay) / 0.4).
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        "bg-2": "rgb(var(--c-bg-2) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        "border-2": "rgb(var(--c-border-2) / <alpha-value>)",
        text: "rgb(var(--c-text) / <alpha-value>)",
        "text-soft": "rgb(var(--c-text-soft) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        "muted-2": "rgb(var(--c-muted-2) / <alpha-value>)",
        "muted-3": "rgb(var(--c-muted-3) / <alpha-value>)",
        "muted-4": "rgb(var(--c-muted-4) / <alpha-value>)",
        clay: "rgb(var(--c-clay) / <alpha-value>)",
        gold: "rgb(var(--c-gold) / <alpha-value>)",
        // Semantic status colours are theme-independent.
        good: "#6FCF97",
        "good-2": "#7FB88A",
        "good-3": "#26352B",
      },
      fontFamily: {
        display: ['"Playfair Display"', "ui-serif", "Georgia", "serif"],
        body: ['"Inter"', "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        content: "1280px",
        prose: "65ch",
      },
      animation: {
        "hero-in": "heroIn 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)",
        "pulse-clay": "pulseClay 2.4s ease-in-out infinite",
      },
      keyframes: {
        heroIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseClay: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.25)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
