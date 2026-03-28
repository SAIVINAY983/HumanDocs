/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#6366f1',
        'brand-secondary': '#fb7185',
        'brand-accent': '#10b981',
        'brand-surface': '#fafaf9',
        'brand-text': '#1f2937',
        'doc-blue': '#4285F4', // Keep for backward compatibility if needed
        'doc-bg': '#f8f9fa',
      },
      borderRadius: {
        'premium': '1.5rem',
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
