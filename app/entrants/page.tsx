import Link from 'next/link';
import { Header } from '@/components/Header';
import { entrants, getTeam } from '@/lib/data';

export const dynamic = 'force-static';

export default function EntrantsPage() {
  const sorted = [...entrants].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="page-enter">
      <Header eyebrow={`${entrants.length} sweepstake participants`} title="Entrants" />
      <div className="px-5 sm:px-8 pt-5">
        <div className="eyebrow mb-4">Tap an entrant for their fixtures, or a country for matches</div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {sorted.map((e, i) => {
            const a = getTeam(e.teamA);
            const b = getTeam(e.teamB);
            return (
              <div key={e.slug} className="ink-card p-3 sm:p-4 min-w-0 hover:border-gold transition-colors">
                <Link href={`/entrants/${e.slug}`} className="flex items-baseline justify-between gap-2 mb-2.5 min-w-0 group">
                  <div className="display text-[15px] sm:text-lg text-text-ink truncate min-w-0 group-hover:text-gold transition-colors">{e.name}</div>
                  <span className="num text-[10px] text-text-ink-faint shrink-0">{String(i + 1).padStart(2, '0')}</span>
                </Link>
                <div className="space-y-1.5 text-[13px] sm:text-sm">
                  {a && (
                    <Link
                      href={`/matches?country=${a.code}`}
                      className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 overflow-hidden hover:text-gold transition-colors"
                    >
                      <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">{a.flag}</span>
                      <span className="text-text-ink truncate font-semibold min-w-0">{a.name}</span>
                      <span className="ml-auto eyebrow shrink-0">Gr. {a.group}</span>
                    </Link>
                  )}
                  {b && (
                    <Link
                      href={`/matches?country=${b.code}`}
                      className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 overflow-hidden hover:text-gold transition-colors"
                    >
                      <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">{b.flag}</span>
                      <span className="text-text-ink truncate font-semibold min-w-0">{b.name}</span>
                      <span className="ml-auto eyebrow shrink-0">Gr. {b.group}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
