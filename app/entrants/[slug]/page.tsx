import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { MatchCard } from '@/components/MatchCard';
import { entrants, getEntrant, getTeam, matchesForEntrant } from '@/lib/data';

export function generateStaticParams() {
  return entrants.map(e => ({ slug: e.slug }));
}

export default function EntrantPage({ params }: { params: { slug: string } }) {
  const entrant = getEntrant(params.slug);
  if (!entrant) notFound();
  const teamA = getTeam(entrant.teamA);
  const teamB = getTeam(entrant.teamB);
  const fixtures = matchesForEntrant(entrant.slug);
  const upcoming = fixtures.filter(m => m.status !== 'completed');
  const past = fixtures.filter(m => m.status === 'completed');

  return (
    <main className="page-enter">
      <Header eyebrow="Entrant" title={entrant.name} back="/entrants" />

      <div className="px-5 sm:px-8 pt-5 space-y-7">

        {/* Teams */}
        <section className="grid grid-cols-2 gap-2 sm:gap-3">
          {[teamA, teamB].map((t, i) => t && (
            <Link key={t.code} href={`/matches?country=${t.code}`} className="surface p-3 sm:p-4 min-w-0 hover:border-gold transition-colors group">
              <div className="eyebrow mb-2">{i === 0 ? 'Top pot' : 'Bottom pot'}</div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-2xl sm:text-3xl leading-none shrink-0" aria-hidden="true">{t.flag}</span>
                <div className="min-w-0 overflow-hidden">
                  <div className="display text-base sm:text-2xl text-text truncate leading-tight group-hover:text-gold transition-colors">{t.name}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gold mt-1">Gr. {t.group}</div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="display text-lg uppercase tracking-tight">Upcoming</h2>
            <span className="eyebrow">{upcoming.length} match{upcoming.length === 1 ? '' : 'es'}</span>
          </div>
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          ) : (
            <div className="paper p-5 text-center text-text-paper-dim text-sm">
              No upcoming fixtures.
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="display text-lg uppercase tracking-tight">Played</h2>
              <span className="eyebrow">{past.length} result{past.length === 1 ? '' : 's'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {past.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
