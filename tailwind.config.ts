import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          foreground: 'var(--color-brand-foreground)',
        },
        agendou: {
          bg: 'var(--agendou-bg)',
          surface: 'var(--agendou-surface)',
          'surface-2': 'var(--agendou-surface-2)',
          text: 'var(--agendou-text)',
          muted: 'var(--agendou-text-muted)',
          faint: 'var(--agendou-text-faint)',
        },
      },
      spacing: {
        18: '4.5rem',
      },
      backgroundImage: {
        'agendou-gradient': 'var(--agendou-gradient)',
      },
    },
  },
  plugins: [],
}

export default config
