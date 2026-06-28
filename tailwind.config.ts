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
        // Clay edition palette — locked from the design bundle
        bg: "#0B0A08",
        "bg-2": "#0E0C0A",
        surface: "#161310",
        "surface-2": "#1C1813",
        border: "#2C2620",
        "border-2": "#4A3D26",
        text: "#F2EDE6",
        "text-soft": "#C9C0B2",
        muted: "#948B7D",
        "muted-2": "#7E766A",
        "muted-3": "#7A7264",
        "muted-4": "#6A6256",
        clay: "#D97757",
        gold: "#F5C451",
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
