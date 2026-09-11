/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dem: '#2166ac',
        rep: '#b2182b',
        tossup: '#8c8c8c',
      },
    },
  },
  plugins: [],
}

