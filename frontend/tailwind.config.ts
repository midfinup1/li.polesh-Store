import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Arial", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "Arial", "sans-serif"],
      },
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        "paper-dark": "var(--paper-dark)",
        "ink-light": "var(--ink-light)",
        border: "var(--border)",
      },
      borderRadius: {
        none: "0px",
        sm: "8px",
        DEFAULT: "8px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
    },
  },
  plugins: [],
};

export default config;