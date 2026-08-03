module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#7eb6ff',
          400: '#3d8fff',
          500: '#0b74ff',
          600: '#005fe6',
          700: '#0047cc',
          800: '#0039a3',
          900: '#002b7a'
        },
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
          400: '#94a3b8',
          200: '#e2e8f0',
          100: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Montserrat', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Montserrat', 'sans-serif']
      },
      boxShadow: {
        auth: '0 18px 50px rgba(15, 23, 42, 0.08)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'soft-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.06)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        'fade-up-delay': 'fade-up 0.7s ease-out 0.12s both',
        'soft-zoom': 'soft-zoom 18s ease-in-out alternate infinite'
      }
    }
  },
  plugins: []
};
