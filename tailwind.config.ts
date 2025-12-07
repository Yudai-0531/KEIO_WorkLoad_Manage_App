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
        'keio-blue': '#0E1546',
        'keio-gold': '#FDD34C',
        'keio-red': '#C4232D',
      },
    },
  },
  plugins: [],
}
export default config
