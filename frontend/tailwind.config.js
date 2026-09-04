/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#050811',
          900: '#080d1a',
          850: '#0c1427',
          800: '#111c38',
          750: '#17254b',
          700: '#1e2f5e',
          600: '#2b4280',
          500: '#3d5ea8',
        },
        surface: {
          base: '#050811',
          card: 'rgba(12, 20, 39, 0.75)',
          'card-hover': 'rgba(17, 28, 56, 0.85)',
          elevated: '#0f1a36',
          border: 'rgba(40, 62, 105, 0.55)',
          'border-focus': 'rgba(6, 182, 212, 0.6)',
        },
        critical: {
          DEFAULT: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.35)',
          bg: 'rgba(244, 63, 94, 0.12)',
          border: 'rgba(244, 63, 94, 0.3)',
        },
        high: {
          DEFAULT: '#f97316',
          glow: 'rgba(249, 115, 22, 0.35)',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.3)',
        },
        medium: {
          DEFAULT: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.35)',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
        },
        low: {
          DEFAULT: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.35)',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)',
        },
        info: {
          DEFAULT: '#64748b',
          glow: 'rgba(100, 116, 139, 0.3)',
          bg: 'rgba(100, 116, 139, 0.12)',
          border: 'rgba(100, 116, 139, 0.3)',
        },
        accent: {
          cyan: '#06b6d4',
          'cyan-glow': 'rgba(6, 182, 212, 0.4)',
          emerald: '#10b981',
          'emerald-glow': 'rgba(16, 185, 129, 0.4)',
          purple: '#a855f7',
          'purple-glow': 'rgba(168, 85, 247, 0.4)',
          indigo: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 24px -4px rgba(6, 182, 212, 0.35)',
        'glow-red': '0 0 24px -4px rgba(244, 63, 94, 0.35)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-purple': '0 0 24px -4px rgba(168, 85, 247, 0.35)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.35)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        }
      }
    },
  },
  plugins: [],
}
