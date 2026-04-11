/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'badge-admin','badge-advocate','badge-user',
    'badge-active','badge-pending','badge-closed','badge-adjourned',
    'animate-float','animate-slide-up','animate-fade-in',
    'glass','mesh-bg','sidebar-bg','btn-glow','gradient-text','shimmer-text',
    'stat-card','table-row','card-hover','nav-active','input-field',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
