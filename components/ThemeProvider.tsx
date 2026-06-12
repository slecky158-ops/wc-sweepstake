'use client';

import { useEffect } from 'react';

// Reads theme preference from localStorage and applies data-theme to <html>.
// Inline script in <head> sets the initial theme synchronously to avoid flicker;
// this component just listens for system preference changes when set to "auto".

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      const mode = stored ?? 'auto';
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = mode === 'auto' ? (sysDark ? 'dark' : 'light') : mode;
      document.documentElement.dataset.theme = effective;
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return <>{children}</>;
}

export function ThemeToggle() {
  const set = (mode: 'light' | 'dark' | 'auto') => {
    if (mode === 'auto') localStorage.removeItem('theme');
    else localStorage.setItem('theme', mode);
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = mode === 'auto' ? (sysDark ? 'dark' : 'light') : mode;
  };

  return (
    <div className="flex gap-2">
      {(['auto', 'light', 'dark'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => set(m)}
          className="chip bg-surface text-muted border-border hover:text-text capitalize"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
