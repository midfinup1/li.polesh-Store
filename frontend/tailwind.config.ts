import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Will be set up with next/font — placeholders for now
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      colors: {
        // Design tokens — customize for the artist's brand
        ink: {
          DEFAULT: "#1a1a1a",
          light: "#4a4a4a",
        },
        paper: {
          DEFAULT: "#ffffff",
          dark: "#c8c8c8",
        },
        accent: {
          DEFAULT: "#b85c38",
          light: "#d4855f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
