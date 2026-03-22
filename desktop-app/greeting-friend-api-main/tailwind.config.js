// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // usa la classe .dark su <html>
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './electron/**/*.{js,ts}', // (se hai file electron)
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        // Remap gray scale to navy dark palette for Design L
        gray: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#243044', // borders → navy border
          800: '#1a2536', // cards → navy card
          900: '#141c27', // bg → navy bg
          950: '#0c1929', // sidebar → navy sidebar
        },
      },
      boxShadow: {
        'btn': '0 1px 2px rgba(0,0,0,.06)',
        'btn-hover': '0 4px 10px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
}