/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#060a12',
          900: '#0b1120',
          850: '#10192d',
          800: '#16233e',
          700: '#233554',
          600: '#384d72'
        },
        rose: {
          950: '#2a060c',
          900: '#4c0c16',
          600: '#e11d48',
          500: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.4)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
