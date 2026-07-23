import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
        },
        primary: {
          DEFAULT: "hsl(var(--brand-primary))",
          dark: "hsl(var(--brand-primary-dark))",
          light: "hsl(var(--brand-primary-light))",
          foreground: "hsl(var(--brand-cream))",
        },
        cream: {
          DEFAULT: "hsl(var(--brand-cream))",
          dark: "hsl(var(--brand-parchment))",
        },
        ivory: "hsl(var(--brand-ivory))",
        gold: {
          DEFAULT: "hsl(var(--brand-gold))",
          dark: "hsl(var(--brand-brass))",
        },
        thistle: {
          DEFAULT: "hsl(var(--brand-purple))",
          muted: "hsl(var(--brand-purple-muted))",
        },
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          muted: "hsl(var(--charcoal-muted))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        muted: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--charcoal-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--charcoal))",
        },
        destructive: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--brand-ivory))",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--charcoal))",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": [
          "clamp(2.625rem, 5.5vw, 5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        "display-lg": [
          "clamp(2.25rem, 4.5vw, 4rem)",
          { lineHeight: "1.08", letterSpacing: "-0.015em" },
        ],
        "display-md": [
          "clamp(1.875rem, 3.5vw, 3rem)",
          { lineHeight: "1.12", letterSpacing: "-0.01em" },
        ],
        "display-sm": ["clamp(1.625rem, 2.5vw, 2rem)", { lineHeight: "1.2" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(18 61 42 / 0.06), 0 4px 12px rgb(18 61 42 / 0.08)",
        "card-hover":
          "0 2px 4px rgb(18 61 42 / 0.08), 0 12px 28px rgb(18 61 42 / 0.14)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-rise": "fade-rise 0.4s ease-out both",
        marquee: "marquee 45s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
