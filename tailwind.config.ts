import type { Config } from "tailwindcss";

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
        brand: {
          navy: "#0E1B47",
          "navy-dark": "#070E26",
          "navy-light": "#182B6B",
          gold: "#C9A14A",
          "gold-light": "#E8C97A",
          "gold-dark": "#9A7526",
        },
        paper: "#FFFFFF",
        ink: "#1A1A1A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        cursive: ["var(--font-great-vibes)", "cursive"],
      },
      boxShadow: {
        luxury: "0 20px 40px -15px rgba(14, 27, 71, 0.2)",
        gold: "0 10px 25px -5px rgba(201, 161, 74, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
