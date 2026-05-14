/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark:    '#3730a3',
          light:   '#eef2ff',
        },
        secondary: {
          DEFAULT: '#7c3aed',
          light:   '#f5f3ff',
        },
        accent: {
          DEFAULT: '#80AF81',
          light:   '#80AF8115',
          border:  '#80AF8140',
        },
        success: {
          DEFAULT: '#10b981',
          bg:      '#f0fdf4',
          border:  '#6ee7b7',
          dark:    '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg:      '#fef3c7',
          border:  '#fde68a',
          dark:    '#92400e',
        },
        danger: {
          DEFAULT: '#ef4444',
          bg:      '#fee2e2',
          border:  '#fca5a5',
          dark:    '#991b1b',
        },
        info: {
          DEFAULT: '#3b82f6',
          bg:      '#eff6ff',
          border:  '#bfdbfe',
        },
      },
      borderRadius: {
        card:    '14px',
        'card-lg': '18px',
        icon:    '12px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        float: '0 4px 20px rgba(0,0,0,0.08)',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
