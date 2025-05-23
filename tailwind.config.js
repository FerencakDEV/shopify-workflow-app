// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  theme: {
  extend: {
    colors: {
      muted: '#3d3d3f',
      'primary-light': '#60a5fa',
      'primary-dark': '#1e3a8a',
      'primary-darker': '#1e293b',
      warning: '#f59e0b',
      info: '#38bdf8',
      smooth: '#7dd3fc',
      city: '#f87171',
      'city-light': '#fecaca',
      success: '#10b981',
    },
  },
},
}

