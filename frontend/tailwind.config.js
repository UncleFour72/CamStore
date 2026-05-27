/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        surface: '#f6faff',
        'surface-soft': '#f0f4fa',
        card: '#ffffff',
        border: '#d9e2ec',
        primary: '#006591',
        'primary-bright': '#0ea5e9',
        ink: '#171c20',
        muted: '#3e4850',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(15, 23, 42, 0.05)',
        lift: '0 18px 42px rgba(15, 23, 42, 0.12)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};
