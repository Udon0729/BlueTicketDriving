/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#dbeafe',
        },
        danger: {
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
        success: {
          DEFAULT: '#16a34a',
        },
      },
    },
  },
  plugins: [],
}
