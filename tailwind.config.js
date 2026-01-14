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
        'deep-navy': '#0f0e47',
        'medium-purple': '#505081',
        'light-purple': '#8686ac',
        'card-bg': '#1a1a5e',
        'success-green': '#00ff88',
        'warning-red': '#ff4444',
      },
    },
  },
  plugins: [],
}
