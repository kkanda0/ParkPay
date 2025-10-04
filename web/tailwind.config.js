/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.1)",
        input: "rgba(255, 255, 255, 0.05)",
        ring: "#06b6d4",
        background: "#0E0E10",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#06b6d4",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#ec4899",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1f2937",
          foreground: "#9ca3af",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "flow": "flow 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(6, 182, 212, 0.5)" },
          to: { boxShadow: "0 0 30px rgba(6, 182, 212, 0.8)" },
        },
        flow: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
