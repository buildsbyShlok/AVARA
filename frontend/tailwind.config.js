/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        avara: {
          50: '#fef2f1',
          100: '#fde6e4',
          200: '#fbc9c5',
          300: '#f8a49e',
          400: '#f2706a',
          500: '#E0533C',
          600: '#c83a2a',
          700: '#a82e20',
          800: '#8b291e',
          900: '#74271f',
        },
        obsidian: {
          DEFAULT: '#0B0F15',
          50: '#f6f7f9',
          100: '#ebedf2',
          200: '#d4d7e0',
          300: '#afb4c4',
          400: '#838ca3',
          500: '#646e89',
          600: '#505871',
          700: '#41475c',
          800: '#383d4e',
          900: '#1D2636',
          950: '#0B0F15',
        },
        sand: {
          50: '#FBFBF9',
          100: '#F9F8F5',
          200: '#F4F4F0',
          300: '#EBEAE3',
          400: '#D5D3C9',
          500: '#B8B5A8',
        },
        gold: {
          DEFAULT: '#D49B3E',
          50: '#fdf8ed',
          100: '#f9edcc',
          200: '#f3d994',
          300: '#edc15c',
          400: '#D49B3E',
          500: '#c07f20',
          600: '#a86319',
          700: '#8c4a18',
          800: '#743b1a',
          900: '#613219',
        },
        forest: '#234237',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'headline': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'subheadline': ['clamp(1.25rem, 3vw, 1.75rem)', { lineHeight: '1.3' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'editorial': '0 20px 60px -15px rgba(0,0,0,0.1)',
        'card': '0 4px 24px -4px rgba(0,0,0,0.08)',
        'card-hover': '0 20px 40px -12px rgba(0,0,0,0.15)',
        'float': '0 30px 60px -20px rgba(0,0,0,0.2)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
      },
    },
  },
  plugins: [],
}
