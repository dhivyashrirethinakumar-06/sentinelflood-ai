/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F19",
          card: "#161E2E",
          border: "#1F2937",
          accent: "#2D3748"
        },
        risk: {
          low: "#10B981",      // Emerald
          medium: "#F59E0B",   // Amber
          high: "#EF4444",     // Red
          critical: "#7F1D1D"  // Dark Red/Burgundy
        },
        brand: {
          cyan: "#06B6D4",
          blue: "#3B82F6",
          red: "#EF4444",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1.2s infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.1 },
        }
      }
    },
  },
  plugins: [],
}
