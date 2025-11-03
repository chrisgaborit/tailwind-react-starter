// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        brandDark: "#1c1c1e",
        brandGray: "#3a3a3c",
        brandField: "#2c2c2e",
        brilliantBlue: "#0387E6",
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      /* Set readable defaults */
      fontSize: {
        base: ['20px', { lineHeight: '1.6' }],
        lg:   ['22px', { lineHeight: '1.6' }],
        xl:   ['24px', { lineHeight: '1.6' }],
        '2xl':['28px', { lineHeight: '1.45' }],
        '3xl':['32px', { lineHeight: '1.35' }],
        '4xl':['36px', { lineHeight: '1.25' }],
      },
      lineHeight: {
        snug: '1.35',
        comfy: '1.6',
      },
      boxShadow: {
        panel: '0 2px 16px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};