const forms = require('@tailwindcss/forms');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    // Override default font sizes with 0.8x scaling factor
    fontSize: {
      'xs': '0.6rem',      // 12px * 0.8 / 16 = 0.6rem
      'sm': '0.7rem',      // 14px * 0.8 / 16 = 0.7rem  
      'base': '0.8rem',    // 16px * 0.8 / 16 = 0.8rem
      'lg': '0.9rem',      // 18px * 0.8 / 16 = 0.9rem
      'xl': '1rem',        // 20px * 0.8 / 16 = 1rem
      '2xl': '1.2rem',     // 24px * 0.8 / 16 = 1.2rem
      '3xl': '1.5rem',     // 30px * 0.8 / 16 = 1.5rem
      '4xl': '1.8rem',     // 36px * 0.8 / 16 = 1.8rem
      '5xl': '2.4rem',     // 48px * 0.8 / 16 = 2.4rem
      '6xl': '3rem',       // 60px * 0.8 / 16 = 3rem
      '7xl': '3.6rem',     // 72px * 0.8 / 16 = 3.6rem
      '8xl': '4.8rem',     // 96px * 0.8 / 16 = 4.8rem
      '9xl': '6.4rem',     // 128px * 0.8 / 16 = 6.4rem
    },
    // Override default spacing with 0.8x scaling factor
    spacing: {
      'px': '1px',
      '0': '0',
      '0.5': '0.1rem',     // 2px * 0.8 / 16 = 0.1rem
      '1': '0.2rem',       // 4px * 0.8 / 16 = 0.2rem
      '1.5': '0.3rem',     // 6px * 0.8 / 16 = 0.3rem
      '2': '0.4rem',       // 8px * 0.8 / 16 = 0.4rem
      '2.5': '0.5rem',     // 10px * 0.8 / 16 = 0.5rem
      '3': '0.6rem',       // 12px * 0.8 / 16 = 0.6rem
      '3.5': '0.7rem',     // 14px * 0.8 / 16 = 0.7rem
      '4': '0.8rem',       // 16px * 0.8 / 16 = 0.8rem
      '5': '1rem',         // 20px * 0.8 / 16 = 1rem
      '6': '1.2rem',       // 24px * 0.8 / 16 = 1.2rem
      '7': '1.4rem',       // 28px * 0.8 / 16 = 1.4rem
      '8': '1.6rem',       // 32px * 0.8 / 16 = 1.6rem
      '9': '1.8rem',       // 36px * 0.8 / 16 = 1.8rem
      '10': '2rem',        // 40px * 0.8 / 16 = 2rem
      '11': '2.2rem',      // 44px * 0.8 / 16 = 2.2rem
      '12': '2.4rem',      // 48px * 0.8 / 16 = 2.4rem
      '14': '2.8rem',      // 56px * 0.8 / 16 = 2.8rem
      '16': '3.2rem',      // 64px * 0.8 / 16 = 3.2rem
      '20': '4rem',        // 80px * 0.8 / 16 = 4rem
      '24': '4.8rem',      // 96px * 0.8 / 16 = 4.8rem
      '28': '5.6rem',      // 112px * 0.8 / 16 = 5.6rem
      '32': '6.4rem',      // 128px * 0.8 / 16 = 6.4rem
      '36': '7.2rem',      // 144px * 0.8 / 16 = 7.2rem
      '40': '8rem',        // 160px * 0.8 / 16 = 8rem
      '44': '8.8rem',      // 176px * 0.8 / 16 = 8.8rem
      '48': '9.6rem',      // 192px * 0.8 / 16 = 9.6rem
      '52': '10.4rem',     // 208px * 0.8 / 16 = 10.4rem
      '56': '11.2rem',     // 224px * 0.8 / 16 = 11.2rem
      '60': '12rem',       // 240px * 0.8 / 16 = 12rem
      '64': '12.8rem',     // 256px * 0.8 / 16 = 12.8rem
      '72': '14.4rem',     // 288px * 0.8 / 16 = 14.4rem
      '80': '16rem',       // 320px * 0.8 / 16 = 16rem
      '96': '19.2rem',     // 384px * 0.8 / 16 = 19.2rem
    },
    extend: {
      colors: {
        dark: '#1a202c',
        mediumDark: '#2d3748',
        accent: '#00ADB5',
        lightText: '#f7fafc',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    forms(),
  ],
}
