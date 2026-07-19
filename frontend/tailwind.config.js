/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#faf6ee',
        'paper-raised': '#ffffff',
        'paper-inset': '#f2ece0',
        line: '#e6ddc9',
        ink: '#2b2620',
        'ink-soft': '#6b6355',
        'ink-faint': '#9c9280',
        accent: '#b5622f',
        'accent-soft': '#f0dccb',
        'accent-ink': '#7a3f1c',
        sage: '#5f7a5e',
        'sage-soft': '#dfe8dc',
        danger: '#a4402f',
      },
      borderRadius: {
        'xl': '14px',
      },
      boxShadow: {
        'custom': '0 1px 2px rgba(43, 38, 32, 0.06), 0 8px 24px rgba(43, 38, 32, 0.05)',
      }
    },
  },
  plugins: [],
}
