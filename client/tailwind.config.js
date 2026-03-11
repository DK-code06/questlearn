/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎮 Custom Game Palette
        game: {
          dark: '#0b0c15',      // Deepest background (almost black)
          card: '#12141f',      // Slightly lighter for cards
          border: '#1f2233',    // Border color
        },
        neon: {
          blue: '#00f3ff',      // Cyan / Electric Blue
          purple: '#bc13fe',    // Bright Neon Purple
          green: '#0aff60',     // Success Green
          red: '#ff0055',       // Error Red
        }
      },
      fontFamily: {
        // Ensure you have a nice font linked in index.html, or use sans default
        sans: ['Inter', 'sans-serif'], 
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Optional: For nice text formatting in lessons
    require('tailwind-scrollbar'),      // Optional: For custom scrollbars
  ],
}