import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const hsl = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
        reading: ['var(--font-reading)', 'Georgia', 'Times New Roman', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Palette
        ink: hsl('ink'),
        paper: hsl('paper'),
        deep: hsl('deep'),
        wash: hsl('wash'),
        line: hsl('line'),
        'muted-ink': hsl('muted-ink'),
        marigold: hsl('marigold'),
        phase: {
          period: hsl('phase-period'),
          follicular: hsl('phase-follicular'),
          ovulation: hsl('phase-ovulation'),
          luteal: hsl('phase-luteal'),
          'period-on-deep': hsl('phase-period-on-deep'),
          'follicular-on-deep': hsl('phase-follicular-on-deep'),
        },
        // shadcn/ui semantic tokens
        background: hsl('background'),
        foreground: hsl('foreground'),
        card: {
          DEFAULT: hsl('card'),
          foreground: hsl('card-foreground'),
        },
        popover: {
          DEFAULT: hsl('popover'),
          foreground: hsl('popover-foreground'),
        },
        primary: {
          DEFAULT: hsl('primary'),
          foreground: hsl('primary-foreground'),
        },
        secondary: {
          DEFAULT: hsl('secondary'),
          foreground: hsl('secondary-foreground'),
        },
        muted: {
          DEFAULT: hsl('muted'),
          foreground: hsl('muted-foreground'),
        },
        accent: {
          DEFAULT: hsl('accent'),
          foreground: hsl('accent-foreground'),
        },
        destructive: {
          DEFAULT: hsl('destructive'),
          foreground: hsl('destructive-foreground'),
        },
        border: hsl('border'),
        input: hsl('input'),
        ring: hsl('ring'),
        brand: {
          DEFAULT: hsl('brand'),
          dark: hsl('brand-dark'),
          light: hsl('brand-light'),
        },
        chart: {
          '1': hsl('phase-period'),
          '2': hsl('phase-follicular'),
          '3': hsl('phase-ovulation'),
          '4': hsl('phase-luteal'),
          '5': hsl('primary'),
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
