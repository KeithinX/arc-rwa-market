import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#f4f7f6",
        foreground: "#0f172a",
        muted: {
          DEFAULT: "#e8eeec",
          foreground: "#475569",
        },
        border: "#d5dedb",
        input: "#d5dedb",
        ring: "#0f766e",
        primary: {
          DEFAULT: "#0f766e",
          foreground: "#ffffff",
          hover: "#0d9488",
        },
        secondary: {
          DEFAULT: "#e8eeec",
          foreground: "#0f172a",
        },
        accent: {
          DEFAULT: "#0f766e",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        success: "#059669",
        danger: "#dc2626",
        arc: {
          bg: "#f4f7f6",
          card: "#ffffff",
          elevated: "#e8eeec",
          border: "#d5dedb",
          hover: "#dde6e3",
          ink: "#0f172a",
          muted: "#475569",
          dim: "#94a3b8",
          accent: "#0f766e",
          yes: "#059669",
          no: "#dc2626",
          warning: "#d97706",
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // 整体抬一档，交易信息更易读
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.4rem" }],
        base: ["1.0625rem", { lineHeight: "1.6rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.625rem", { lineHeight: "2.1rem" }],
        "3xl": ["2rem", { lineHeight: "2.35rem" }],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 0 rgba(15,23,42,0.02)",
      },
    },
  },
  plugins: [],
};

export default config;
