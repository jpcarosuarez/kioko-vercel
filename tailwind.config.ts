import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssAspectRatio from "@tailwindcss/aspect-ratio";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ==========================================
      // CUSTOM COLOR PALETTE SYSTEM
      // ==========================================
      // Organized by primary, secondary, and neutral with scales (50-900)
      // Easy to switch themes by changing the CSS variables
      colors: {
        // Primary color palette (Indigo-based)
        primary: {
          50: "rgb(var(--c-primary-50))",
          100: "rgb(var(--c-primary-100))",
          200: "rgb(var(--c-primary-200))",
          300: "rgb(var(--c-primary-300))",
          400: "rgb(var(--c-primary-400))",
          500: "rgb(var(--c-primary-500))",
          600: "rgb(var(--c-primary-600))",
          700: "rgb(var(--c-primary-700))",
          800: "rgb(var(--c-primary-800))",
          900: "rgb(var(--c-primary-900))",
          DEFAULT: "rgb(var(--c-primary-500))",
          foreground: "rgb(var(--c-neutral-50))",
        },
        // Secondary color palette (Teal-based)
        secondary: {
          50: "rgb(var(--c-secondary-50))",
          100: "rgb(var(--c-secondary-100))",
          200: "rgb(var(--c-secondary-200))",
          300: "rgb(var(--c-secondary-300))",
          400: "rgb(var(--c-secondary-400))",
          500: "rgb(var(--c-secondary-500))",
          600: "rgb(var(--c-secondary-600))",
          700: "rgb(var(--c-secondary-700))",
          800: "rgb(var(--c-secondary-800))",
          900: "rgb(var(--c-secondary-900))",
          DEFAULT: "rgb(var(--c-secondary-500))",
          foreground: "rgb(var(--c-neutral-50))",
        },
        // Neutral color palette (Cool Grey-based)
        neutral: {
          50: "rgb(var(--c-neutral-50))",
          100: "rgb(var(--c-neutral-100))",
          200: "rgb(var(--c-neutral-200))",
          300: "rgb(var(--c-neutral-300))",
          400: "rgb(var(--c-neutral-400))",
          500: "rgb(var(--c-neutral-500))",
          600: "rgb(var(--c-neutral-600))",
          700: "rgb(var(--c-neutral-700))",
          800: "rgb(var(--c-neutral-800))",
          900: "rgb(var(--c-neutral-900))",
          DEFAULT: "rgb(var(--c-neutral-500))",
          foreground: "rgb(var(--c-neutral-50))",
        },
        // Legacy shadcn/ui colors (maintained for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      // ==========================================
      // TYPOGRAPHY SYSTEM
      // ==========================================
      // Poppins as the global sans-serif font
      fontFamily: {
        sans: [
          "Poppins",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      // Font weights for Poppins
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssAspectRatio],
} satisfies Config;
