// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    // ✅ THE FIX IS HERE: We added 'css' to this line
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
    },
  },
  plugins: [],
};