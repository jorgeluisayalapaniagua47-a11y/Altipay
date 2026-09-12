/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1", // Indigo Principal
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        escrow: {
          locked: "#F59E0B",   // Ambar - Bloqueado
          dispatched: "#3B82F6", // Azul - En camino
          success: "#10B981",  // Esmeralda - Garantizado / Liberado
          refunded: "#EF4444", // Rojo - Reembolsado
        },
        surface: {
          darker: "#070B14",
          dark: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
        }
      },
    },
  },
  plugins: [],
};
