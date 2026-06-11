/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background:     'var(--background)',
        'surface-card': 'var(--surface-card)',
        'surface-hover':'var(--surface-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-disabled': 'var(--text-disabled)',
        'border-subtle': 'var(--border-subtle)',
        accent:           'var(--accent)',
        'accent-hover':   'var(--accent-hover)',
        'accent-contrast':'var(--accent-contrast)',
        success:        'var(--success)',
        warning:        'var(--warning)',
        error:          'var(--error)',
        // Glassmorphism surfaces
        glass:          'var(--glass-bg)',
        'glass-strong': 'var(--glass-bg-strong)',
        'glass-border': 'var(--glass-border)',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input:  '8px',
        card:   '12px',
        modal:  '16px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast:    '150ms',
        DEFAULT: '200ms',
        enter:   '400ms',
      },
      fontSize: {
        'input-base': ['16px', '1.5'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
