/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#131318',
        'surface-low': '#1b1b20',
        'surface-mid': '#26252b',
        'surface-high': '#35343a',
        'surface-highest': '#3f3d46',
        'outline-var': '#464554',
        primary: '#c0c1ff',
        'primary-dim': '#9899e0',
        indigo: {
          500: '#6366f1',
        },
        purple: {
          500: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1, #a855f7)',
        'brand-gradient-h': 'linear-gradient(90deg, #6366f1, #a855f7)',
        'glow-bg': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)',
      },
      boxShadow: {
        modal: '0 8px 32px rgba(99,102,241,0.08)',
        glow: '0 0 20px rgba(99,102,241,0.25)',
      },
      borderRadius: {
        md: '6px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-dot': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
