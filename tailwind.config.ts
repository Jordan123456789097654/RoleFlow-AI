import type { Config } from "tailwindcss";

/**
 * Design tokens. Colors are CSS variables (see src/app/globals.css) so light and dark
 * themes switch without touching components. Use the semantic names below:
 *   bg-app · bg-panel · bg-card · bg-hover · border-line
 *   text-ink · text-muted · bg-accent · hover:bg-accent-hover · text-accent · bg-accent-soft
 *   text-on-accent (charcoal text for amber fills) · text-danger · bg-danger-soft
 * All of them accept opacity modifiers, e.g. bg-accent/10.
 *
 * Raw logo colors (charcoal, bone, amber, ochre, ember, rust) are also available
 * for decoration, e.g. text-ember or bg-rust/20.
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
        "accent-soft": "rgb(var(--c-accent) / 0.14)",
        "on-accent": "rgb(var(--c-on-accent) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--c-danger) / 0.12)",
        // Raw logo palette
        charcoal: "#242422",
        bone: "#F3F3EE",
        amber: "#F59E0B",
        ochre: "#D97706",
        ember: "#EA580C",
        rust: "#7C2D12",
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Bricolage Grotesque", "Arial Narrow", "system-ui", "sans-serif"],
        mono: ["Martian Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px",
        lg: "5px",
        xl: "6px",
        "2xl": "8px",
        "3xl": "10px",
      },
      boxShadow: {
        composer: "0 0 0 1px rgb(var(--c-line)), 0 10px 40px -12px rgb(0 0 0 / 0.25)",
        menu: "0 0 0 1px rgb(var(--c-line)), 0 18px 48px -8px rgb(0 0 0 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
