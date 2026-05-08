module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e27f29',
          light: '#f7a25f',
          dark: '#b35f0f',
        },
        cream: '#f3eeea',
        surface: '#ffffff',
        slate: {
          50: '#f8f9fb',
          100: '#eef1f6',
          200: '#d9dee8',
          300: '#bfc7d4',
          400: '#97a0b1',
          500: '#6d738d',
          600: '#4f546f',
          700: '#343b54',
          800: '#21273b',
          900: '#141826',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        7: '1.75rem',
        9: '2.25rem',
        11: '2.75rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 24px 80px rgba(0, 0, 0, 0.08)',
      },
      lineHeight: {
        relaxed: '1.75',
        snug: '1.4',
      },
    },
  },
  plugins: [],
};
