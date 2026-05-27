/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#2563EB',
          500: '#3B82F6',
          100: '#DBEAFE',
        },
        neutral: {
          white: '#FFFFFF',
          background: '#F8FAFC',
          border: '#E5E7EB',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
}
