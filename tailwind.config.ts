import type { Config } from 'tailwindcss';

const cssVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: cssVar('bg'),
        'bg-deep': cssVar('bg-deep'),
        paper: cssVar('paper'),
        'paper-soft': cssVar('paper-soft'),
        'paper-line': cssVar('paper-line'),
        text: cssVar('text'),
        'text-soft': cssVar('text-soft'),
        'text-dim': cssVar('text-dim'),
        'text-faint': cssVar('text-faint'),
        'text-line': cssVar('text-line'),
        ink: cssVar('ink'),
        'ink-deep': cssVar('ink-deep'),
        'ink-elev': cssVar('ink-elev'),
        'ink-line': cssVar('ink-line'),
        'text-ink': cssVar('text-ink'),
        'text-ink-dim': cssVar('text-ink-dim'),
        'text-ink-faint': cssVar('text-ink-faint'),
        // Legacy paper-text aliases — keep so existing match-card markup still works.
        'text-paper': cssVar('text'),
        'text-paper-dim': cssVar('text-dim'),
        'text-paper-faint': cssVar('text-faint'),
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
