import type { Config } from "tailwindcss";

/**
 * Design tokens. Colors are CSS variables (see src/app/globals.css) so light and dark
 * themes switch without touching components. Use the semantic names below:
 *   bg-app · bg-panel · bg-card · bg-hover · border-line
 *   text-ink · text-muted · bg-accent · hover:bg-accent-hover · text-accent · bg-accent-soft
 *   text-danger · bg-danger-soft
 * All of them accept opacity modifiers, e.g. bg-accent/10.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "rgb(var(--c-app) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        hover: "rgb(var(--c-hover) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--c-accent-hover) / <alpha-value>)",
        "accent-soft": "rgb(var(--c-accent) / 0.12)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--c-danger) / 0.12)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "Cambria", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        composer: "0 0 0 1px rgb(var(--c-line)), 0 4px 24px rgb(0 0 0 / 0.04)",
        menu: "0 0 0 1px rgb(var(--c-line)), 0 12px 32px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
