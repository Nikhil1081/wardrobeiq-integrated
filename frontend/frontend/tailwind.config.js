/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07070B',
          900: '#0D0D14',
          850: '#12121D',
          800: '#181827',
          750: '#202033',
          700: '#2A2A42',
        },
        luxury: {
          blush: '#F2B5D4',
          'blush-soft': '#F7D3E5',
          rose: '#D8829D',
          lavender: '#C5B9E8',
          'lavender-soft': '#E2DCF5',
          peach: '#F4C2A1',
          champagne: '#F7E7CE',
          cream: '#FAF7F2',
          sage: '#9BB8A7',
          'sage-soft': '#C1D7CA',
          gold: '#E5C388',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        heavy: '24px',
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(242, 181, 212, 0.25)',
        'glow-rose': '0 0 30px -5px rgba(216, 130, 157, 0.35)',
        'glow-lavender': '0 0 30px -5px rgba(197, 185, 232, 0.35)',
        'glow-peach': '0 0 30px -5px rgba(244, 194, 161, 0.35)',
        'glow-sage': '0 0 30px -5px rgba(155, 184, 167, 0.35)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
