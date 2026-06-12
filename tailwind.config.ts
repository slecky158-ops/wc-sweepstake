import type { Config } from 'tailwindcss';

const cssVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: cssVar('ink'),
        'ink-deep': cssVar('ink-deep'),
        'ink-elev': cssVar('ink-elev'),
        'ink-line': cssVar('ink-line'),
        paper: cssVar('paper'),
        'paper-soft': cssVar('paper-soft'),
        'paper-line': cssVar('paper-line'),
        'text-ink': cssVar('text-on-ink'),
        'text-ink-dim': cssVar('text-on-ink-dim'),
        'text-ink-faint': cssVar('text-on-ink-faint'),
        'text-paper': cssVar('text-on-paper'),
        'text-paper-dim': cssVar('text-on-paper-dim'),
        'text-paper-faint': cssVar('text-on-paper-faint'),
        gold: cssVar('gold'),
        'gold-deep': cssVar('gold-deep'),
        'gold-soft': cssVar('gold-soft'),
        can: cssVar('can'),
        'can-deep': cssVar('can-deep'),
        mex: cssVar('mex'),
        'mex-deep': cssVar('mex-deep'),
        usa: cssVar('usa'),
        'usa-deep': cssVar('usa-deep'),
        signal: cssVar('signal'),
        done: cssVar('done'),
        info: cssVar('info'),
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
