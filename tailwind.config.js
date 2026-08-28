/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./frontend/**/*.{html,js}",
    "./frontend/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#080c15',
        darkcard: '#111827',
        darkborder: '#1e293b',
        neon: {
          green: '#00FFAA',
          cyan: '#00E5FF',
          purple: '#B026FF',
          pink: '#FF007A',
          amber: '#FFAA00',
          blue: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
