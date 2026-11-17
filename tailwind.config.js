/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FDFBF7', 100: '#FAF7F1', 200: '#F4EDE2' },
        ink: { 900: '#1C1B19', 800: '#2C2A26', 700: '#443F38', 500: '#6B645A', 400: '#948C80' },
        stone: { 100: '#F5F3F0', 200: '#E7E3DC', 300: '#D6D0C6' },
        forest: { 50: '#F1F5F2', 100: '#DFE9E2', 500: '#3F6B58', 600: '#315747', 700: '#26453A', 800: '#1E372E' },
        clay: { 50: '#FBF3ED', 100: '#F4E2D5', 500: '#B96B3C', 600: '#A35A2E', 700: '#834728' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,27,25,.04), 0 8px 24px rgba(28,27,25,.05)',
        lift: '0 12px 40px rgba(28,27,25,.10)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'slide-up': 'slide-up .4s ease-out both',
      },
    },
  },
  plugins: [],
};
