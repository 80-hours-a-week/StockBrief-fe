import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        muted: "#66736d",
        line: "#dce4df",
        field: "#f7faf8",
        accent: "#0f766e",
        caution: "#9a5b13",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(15, 118, 110, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
