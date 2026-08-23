/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#000000',
          secondary: '#08080a',
          lighter: '#1c1b22',
          card: '#0c0c0e'
        },
        // Muted Metallic Palette
        neon: {
          blue: '#4DA3FF',
          purple: '#80BCFF',
          pink: '#B3D7FF',
          green: '#10B981',
          orange: '#F97316',
          red: '#EF4444',
          yellow: '#F59E0B'
        },
        space: {
          dark: '#000000',
          darker: '#000000',
          navy: '#0a0a0c',
          blue: '#16151a',
          purple: '#232128'
        },
        cyber: {
          50: '#f5f4f6',
          100: '#e8e6eb',
          200: '#d4cbdc',
          300: '#bdaec8',
          400: '#80BCFF',
          500: '#1A88FF',
          600: '#006ED9',
          700: '#003D72',
          800: '#3b3846',
          900: '#26242d'
        }
      },
      fontFamily: {
        'sans': ['General Sans', 'sans-serif'],
        'cyber': ['Orbitron', 'monospace'],
        'space': ['Exo 2', 'sans-serif']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite'
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
            textShadow: '0 0 5px #00ffff'
          },
          '100%': { 
            boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
            textShadow: '0 0 10px #00ffff'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'space-gradient': 'linear-gradient(135deg, #000000 0%, #16151a 50%, #2b2933 100%)',
        'neon-gradient': 'linear-gradient(45deg, #003D72 0%, #80BCFF 50%, #4DA3FF 100%)'
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        'neon': '0 0 5px #4DA3FF, 0 0 10px #80BCFF',
        'neon-lg': '0 0 10px #4DA3FF, 0 0 25px #80BCFF',
        'neon-purple': '0 0 5px #006ED9, 0 0 10px #003D72',
        'neon-pink': '0 0 5px #B3D7FF, 0 0 10px #4DA3FF',
        'cyber': '0 4px 14px 0 rgba(166, 128, 140, 0.3)',
        'cyber-lg': '0 10px 25px 0 rgba(166, 128, 140, 0.4)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    })
  ]
}