import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gio: {
          black: '#111111',
          red: '#EC1C24',
          grey: '#F5F5F5',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        bdo: ['var(--font-bdo)', 'sans-serif'],
      },
      fontSize: {
        // All weights capped at 400 per brand guidelines
        display: [
          'clamp(2rem, 3.6vw, 3.25rem)',
          { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '400' },
        ],
        headline: [
          'clamp(1.625rem, 2.6vw, 2.375rem)',
          { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '400' },
        ],
        title: [
          'clamp(1.125rem, 1.6vw, 1.5rem)',
          { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '400' },
        ],
        body: [
          '1rem',
          { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' },
        ],
        caption: [
          '0.875rem',
          { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' },
        ],
        small: [
          '0.75rem',
          { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' },
        ],
      },
      spacing: {
        section: 'clamp(3.5rem, 8vw, 7.5rem)',
        container: 'clamp(1rem, 3vw, 48px)',
      },
      maxWidth: {
        container: '1824px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
