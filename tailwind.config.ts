// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EC4899", // Vibrant pink
          foreground: "#FFFFFF",
        },
        background: "#F0F0F3", // Light gray background for neumorphism
        surface: "#F0F0F3", // Base color for neumorphic elements
      },
      boxShadow: {
        "neumorphic-sm":
          "4px 4px 8px rgba(163, 177, 198, 0.3), -4px -4px 8px rgba(255, 255, 255, 0.8)",
        neumorphic:
          "8px 8px 16px rgba(163, 177, 198, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.8)",
        "neumorphic-inset":
          "inset 4px 4px 8px rgba(163, 177, 198, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;