/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#4F46E5',
          500: '#6366F1',
          100: '#E0E7FF',
        },
        accent: {
          blue: '#4F8EF7',
          purple: '#7F77DD',
          rose: '#D4537E',
          violet: '#8B5CF6',
        },
        neutral: {
          white: '#FFFFFF',
          background: '#F1F5F9',
          border: '#E2E8F0',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
      },
      boxShadow: {
        card: '0 4px 14px rgba(79, 70, 229, 0.08)',
      },
    },
  },
  plugins: [],
}
