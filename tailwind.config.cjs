/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.{ts,tsx,js,jsx}',
    './index.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
    './**/*.tsx',
    './**/*.ts',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

