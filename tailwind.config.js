/** @type {import('tailwindcss').Config} */
export default {
  // Specify the paths to all of your template files
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom colors, spacing, or shadows here
      colors: {
        brand: {
          light: '#3fbaeb',
          DEFAULT: '#0fa9e6',
          dark: '#0c87b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [
    // Common plugins you might want to install:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'),
  ],
}