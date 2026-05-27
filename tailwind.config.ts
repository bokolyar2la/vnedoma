import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        city: {
          ink: "#172026",
          muted: "#5f6f7a",
          line: "#dfe8ec",
          soft: "#f4f8f7",
          green: "#1f8a70",
          coral: "#e66a4e",
          blue: "#2f6f9f"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
