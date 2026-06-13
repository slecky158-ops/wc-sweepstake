'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          label: 'Daily' },
  { href: '/matches',   label: 'Matches' },
  { href: '/entrants',  label: 'Entrants' },
  { href: '/awards',    label: 'Awards' },
  { href: '/rules',     label: 'Rules' },
];

export function Nav() {
  const path = usePathname() || '/';
  const isActive = (href: string) =>
    href === '/' ? path === '/' : path.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-paper/95 backdrop-blur-md border-t border-paper-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {NAV.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center justify-center py-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                active ? 'text-gold-deep' : 'text-text-faint hover:text-text'
              }`}
            >
              {label}
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gold"/>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
