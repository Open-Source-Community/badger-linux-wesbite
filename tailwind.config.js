/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Space Grotesk'", "sans-serif"],
      },
      colors: {
        bg: "#0a0e0a",
        surface: "#111611",
        card: "#151d14",
        border: "#1e2e1a",
        accent: "#39d353",
        "accent-dim": "#2a9e3e",
        "text-base": "#c8e6c0",
        "text-dim": "#6b8f63",
        "text-muted": "#3d5c36",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
