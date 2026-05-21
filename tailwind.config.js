/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00ff41',
          dark: '#003b00',
          light: '#33ff67',
        },
        casino: {
          black: '#0a0a0b',
          surface: '#16161a',
          border: '#2e303a',
          glow: 'rgba(0, 255, 65, 0.2)',
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'coin-flip-heads': 'coin-flip-heads 2s ease-out forwards',
        'coin-flip-tails': 'coin-flip-tails 2s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: 0.8, filter: 'brightness(1.5)' },
        },
        'coin-flip-heads': {
          '0%': { transform: 'rotateY(0) scale(1)' },
          '50%': { transform: 'rotateY(900deg) scale(1.5)' },
          '100%': { transform: 'rotateY(1800deg) scale(1)' },
        },
        'coin-flip-tails': {
          '0%': { transform: 'rotateY(0) scale(1)' },
          '50%': { transform: 'rotateY(900deg) scale(1.5)' },
          '100%': { transform: 'rotateY(1980deg) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
