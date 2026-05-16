import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F172A',
          secondary: '#1E293B',
          card: '#1E293B',
          border: '#334155',
        },
        accent: {
          green: '#10B981',
          'green-dim': 'rgba(16,185,129,0.15)',
          red: '#EF4444',
          'red-dim': 'rgba(239,68,68,0.15)',
          blue: '#3B82F6',
          'blue-dim': 'rgba(59,130,246,0.15)',
          yellow: '#F59E0B',
          'yellow-dim': 'rgba(245,158,11,0.15)',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
