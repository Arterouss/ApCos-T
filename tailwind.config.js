/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette
        surface: {
          DEFAULT: '#08080c',
          50: '#0c0c12',
          100: '#101018',
          200: '#14141e',
          300: '#1a1a26',
          400: '#22222e',
        },
        // Neon accent — Cinema (Adult) mode
        neon: {
          red: '#ff2d55',
          rose: '#ff375f',
          amber: '#ffb347',
          glow: 'rgba(255, 45, 85, 0.35)',
        },
        // Neon accent — HUB (General) mode
        aurora: {
          cyan: '#00e5ff',
          violet: '#7c4dff',
          sky: '#40c4ff',
          glow: 'rgba(0, 229, 255, 0.35)',
        },
        // Glass tokens
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.06)',
          borderHover: 'rgba(255, 255, 255, 0.12)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Outfit"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(255, 45, 85, 0.25), 0 0 60px rgba(255, 45, 85, 0.1)',
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.25), 0 0 60px rgba(0, 229, 255, 0.1)',
        'glow-amber': '0 0 20px rgba(255, 179, 71, 0.25), 0 0 60px rgba(255, 179, 71, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'card-hover': '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 45, 85, 0.08)',
        'inner-glow': 'inset 0 0 30px rgba(255, 255, 255, 0.03)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(255, 45, 85, 0.2)' },
          '50%': { borderColor: 'rgba(255, 45, 85, 0.5)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-5%,-10%)' },
          '20%': { transform: 'translate(-15%,5%)' },
          '30%': { transform: 'translate(7%,-25%)' },
          '40%': { transform: 'translate(-5%,25%)' },
          '50%': { transform: 'translate(-15%,10%)' },
          '60%': { transform: 'translate(15%,0%)' },
          '70%': { transform: 'translate(0%,15%)' },
          '80%': { transform: 'translate(3%,35%)' },
          '90%': { transform: 'translate(-10%,10%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        aurora: 'aurora 8s ease-in-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        grain: 'grain 8s steps(10) infinite',
      },
    },
  },
  plugins: [],
}
