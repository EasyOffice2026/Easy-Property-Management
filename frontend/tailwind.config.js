/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        'primary-light': '#2a5298',
        gold: '#c8972b',
        'gold-light': '#f0c040',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        bg: '#f0f4f8',
      },
      spacing: {
        sidebar: '240px',
      },
    },
  },
  plugins: [],
};
