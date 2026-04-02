/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#fafaf9',
          100: '#f5f5f0',
          200: '#e8e6df',
          300: '#d4d0c8',
          400: '#a39e93',
          500: '#78736a',
          600: '#5c5850',
          700: '#3d3a35',
          800: '#2a2825',
          900: '#1a1917',
          950: '#0d0d0c',
        },
        accent: {
          DEFAULT: '#e85d26',
          light: '#ff7a45',
          dark: '#c44a1a',
        },
        success: '#2d9d5c',
        warning: '#e8a317',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
