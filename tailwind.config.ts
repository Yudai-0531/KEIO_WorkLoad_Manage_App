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
        'navy-dark': '#001f3f',
        'purple-accent': '#A020F0',
        'purple-deep': '#9932CC',
        'yellow-alert': '#FFD700',
        'red-danger': '#DC143C',
      },
    },
  },
  plugins: [],
}
export default config
