/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#05070D',
          card: '#0B1020',
          card2: '#101827',
        },
        border: {
          DEFAULT: '#25304A',
          light: '#42536F',
        },
        violet: {
          primary: '#D6A13A',
          light: '#FFE08A',
          muted: '#A66B1E',
        },
        gold: {
          primary: '#D6A13A',
          light: '#FFE08A',
          muted: '#A66B1E',
        },
        accent: {
          blue: '#22D3EE',
          green: '#22C55E',
          red: '#EF4444',
          amber: '#FBBF24',
        },
        text: {
          primary: '#F5F0E6',
          secondary: '#A7B3C8',
          muted: '#66728A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-rp': 'linear-gradient(135deg, #05070D 0%, #0B1020 48%, #05070D 100%)',
        'gradient-violet': 'linear-gradient(135deg, #FFE08A 0%, #D6A13A 48%, #22D3EE 100%)',
        'gradient-card': 'linear-gradient(135deg, #0B1020 0%, #101827 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        card: '0 2px 18px rgba(0,0,0,0.48)',
        'card-hover': '0 6px 28px rgba(214, 161, 58, 0.16)',
        glow: '0 0 22px rgba(214, 161, 58, 0.32)',
      },
    },
  },
  plugins: [],
};
