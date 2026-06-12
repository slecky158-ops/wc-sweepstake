'use client';

import { useRouter } from 'next/navigation';

export function DateDropdown({
  dates,
  activeDate,
  formatLabel,
}: {
  dates: string[];
  activeDate: string;
  formatLabel: (d: string) => string;
}) {
  const router = useRouter();

  if (dates.length <= 1) return null;

  return (
    <label className="relative inline-flex items-center cursor-pointer group">
      <select
        value={activeDate}
        onChange={(e) => {
          const v = e.target.value;
          router.push(v === dates[0] ? '/' : `/?date=${v}`);
        }}
        className="appearance-none bg-transparent border border-white/20 hover:border-gold/60 transition-colors rounded text-[10px] uppercase tracking-[0.16em] font-bold text-white/70 py-1.5 pl-2.5 pr-7 cursor-pointer focus:outline-none focus:border-gold"
      >
        {dates.map((d) => (
          <option key={d} value={d} className="bg-ink text-text-ink">
            {formatLabel(d)}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 w-2.5 h-2.5 pointer-events-none text-white/70 group-hover:text-gold transition-colors"
        viewBox="0 0 10 6"
        fill="none"
      >
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  );
}
