/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        brand: { DEFAULT: v('brand'), deep: v('brand-deep'), soft: v('brand-soft') },
        accent: { DEFAULT: v('accent'), soft: v('accent-soft') },
        success: v('success'),
        warning: v('warning'),
        danger: v('danger'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      boxShadow: {
        lift: '0 1px 0 rgb(var(--line)), 0 12px 32px -18px rgb(var(--shadow) / 0.45)',
        pop: '0 24px 60px -24px rgb(var(--shadow) / 0.55)',
      },
      keyframes: {
        ink: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        stamp: { '0%': { opacity: 0, transform: 'scale(1.08) rotate(-4deg)' }, '100%': { opacity: 1, transform: 'rotate(-4deg)' } },
      },
      animation: {
        ink: 'ink .7s cubic-bezier(.2,.7,.2,1) both',
        stamp: 'stamp .5s .9s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
