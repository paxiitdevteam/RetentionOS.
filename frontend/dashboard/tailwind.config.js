/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#003A78',
          green: '#1F9D55',
        },
        grey: {
          1: '#F5F5F5',
          2: '#B5B5B5',
          3: '#333333',
        },
        status: {
          success: '#1F9D55',
          warning: '#F0AD4E',
          danger: '#D9534F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

