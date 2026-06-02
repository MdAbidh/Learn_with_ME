/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        surface: {
          50:  '#ffffff',
          100: '#f9fafb',
          200: '#f3f4f6',
          300: '#e5e7eb',
        },
        // Dark mode
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#18181f',
          600: '#1f1f28',
          500: '#27272f',
          border: 'rgba(255,255,255,0.08)',
        },
        // Brand: Orange accent for dark, slate for light
        brand: {
          DEFAULT: '#f97316',
          light:   '#fb923c',
          dark:    '#ea6c0a',
          glow:    'rgba(249,115,22,0.25)',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.25rem',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4)',
        brand: '0 0 20px rgba(249,115,22,0.3)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
