import Image from 'next/image';
import Link from 'next/link';
import { DailyMatchCard } from '@/components/DailyMatchCard';
import { DateDropdown } from '@/components/DateDropdown';
import { pickDaily, archiveDatesDesc, formatArchiveDate, rules } from '@/lib/data';
import { getLiveScores, liveStateFor } from '@/lib/live';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: { date?: string } }) {
  const { payload: daily, dateKey, isLatest } = pickDaily(searchParams.date);
  const live = isLatest ? await getLiveScores() : new Map();

  return (
    <main className="page-enter">

      {/* ═══════ HERO (kept dark navy) ═══════ */}
      <section className="relative overflow-hidden bg-ink-deep" data-screenshot-hide={undefined}>
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 right-0 w-1/2 h-full" style={{ background: 'linear-gradient(180deg, rgb(var(--gold)), transparent 60%)' }} />
        </div>

        <div className="relative z-10 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 sm:px-8 sm:pb-6 overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="eyebrow text-gold shrink-0">FIFA</span>
              <span className="text-gold/30 shrink-0">|</span>
              <span className="eyebrow truncate text-text-ink-dim">Sweepstake</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {archiveDatesDesc.length > 1 && (
                <span data-screenshot-hide>
                  <DateDropdown
                    options={archiveDatesDesc.map((d) => ({ value: d, label: formatArchiveDate(d) }))}
                    activeValue={dateKey}
                    latestValue={archiveDatesDesc[0]}
                  />
                </span>
              )}
              <div className="text-right">
                <div className="eyebrow text-text-ink-dim mb-0.5">{daily.dateRest}</div>
                <div className="display text-lg sm:text-xl text-gold leading-none whitespace-nowrap">{daily.dateDay}</div>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-3 sm:gap-5 min-w-0">
            <Image
              src="/fifa-2026-emblem.webp"
              alt="FIFA World Cup 26"
              width={96}
              height={114}
              className="h-20 sm:h-28 w-auto shrink-0 drop-shadow-[0_8px_24px_rgba(217,164,65,0.25)]"
              priority
            />
            <div className="min-w-0 pb-1 overflow-hidden">
              <div className="display text-[28px] sm:text-4xl leading-[0.95] tracking-tight">
                <div className="text-text-ink">WORLD CUP</div>
                <div className="text-gold">DAILY</div>
              </div>
              <div className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-bold text-text-ink-dim truncate">
                Canada · Mexico · USA
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 h-1">
          <div style={{ background: 'rgb(var(--can))' }} />
          <div style={{ background: 'rgb(var(--mex))' }} />
          <div style={{ background: 'rgb(var(--usa))' }} />
        </div>
      </section>

      {/* ═══════ BODY (cream) ═══════ */}
      <div className="px-5 sm:px-8 pt-8 space-y-10 pb-6">

        {!isLatest && (
          <div className="paper border-l-4 border-gold p-4 text-sm" data-screenshot-hide>
            <span className="eyebrow mr-2">Archive</span>
            <span className="text-text">You&apos;re viewing the {daily.dateDay} update.</span>
            <Link href="/" className="text-gold-deep font-bold ml-2">← Back to today</Link>
          </div>
        )}

        <Section accent="signal" label="Today" count={daily.todayCount} storyline={daily.todayStoryline}>
          {daily.today.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {daily.today.map(m => <DailyMatchCard key={m.matchId} match={m} kind="today" live={liveStateFor(live, m.teamA, m.teamB, m.kickoffUk)} />)}
            </div>
          ) : (
            <EmptyState title="Rest day" body="No matches inside this day's window (08:00 UK → 08:00 UK)." />
          )}
        </Section>

        <Section accent="done" label="Yesterday" count={daily.yesterdayCount} storyline={daily.yesterdayStoryline}>
          {daily.yesterday.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {daily.yesterday.map(m => <DailyMatchCard key={m.matchId} match={m} kind="yesterday" live={liveStateFor(live, m.teamA, m.teamB, m.kickoffUk)} />)}
            </div>
          ) : (
            <EmptyState
              title={daily.yesterdayCount === 'Pre-tournament' ? "Tournament hasn't started" : 'Nothing yesterday'}
              body="World Cup 26 kicks off today. Tomorrow's daily will recap and preview matchday two."
            />
          )}
        </Section>

        <Section accent="info" label="Beyond Football" count="Last 24h">
          <article className="paper border-l-4 border-info p-5 sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-info mb-2">{daily.news.kicker}</div>
            <h3 className="display text-xl sm:text-2xl text-text leading-tight mb-3">{daily.news.headline}</h3>
            <p className="text-sm text-text-dim leading-relaxed">{daily.news.body}</p>
            <div className="mt-4 text-[11px] text-text-faint font-bold uppercase tracking-widest">{daily.news.source}</div>
          </article>
        </Section>

        <section className="border-t border-paper-line pt-4 flex items-center justify-between flex-wrap gap-2 text-[11px] uppercase tracking-widest font-bold">
          <div className="text-text-faint">
            Generated {new Date(daily.generatedAt).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })} UK
          </div>
          <Link href="/rules" className="text-gold-deep hover:text-gold">
            Pot {rules.currency}{rules.potTotal} · {rules.entrants} entrants →
          </Link>
        </section>

      </div>
    </main>
  );
}

function Section({
  accent, label, count, storyline, children,
}: {
  accent: 'signal' | 'done' | 'info';
  label: string;
  count: string;
  storyline?: { headline: string; subtitle: string } | null;
  children: React.ReactNode;
}) {
  const bg = accent === 'signal' ? 'bg-signal' : accent === 'done' ? 'bg-done' : 'bg-info';
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className={`${bg} h-6 w-1`} />
          <h2 className="display text-2xl tracking-tight uppercase text-text">{label}</h2>
        </div>
        <span className="eyebrow">{count}</span>
      </div>

      {storyline && (
        <div className="mb-4 pl-4 border-l-2 border-paper-line">
          <h3 className="display text-lg sm:text-xl leading-tight mb-1.5 text-text">{storyline.headline}</h3>
          <p className="text-sm text-text-dim leading-relaxed">{storyline.subtitle}</p>
        </div>
      )}

      {children}
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="paper p-6 sm:p-8 text-center">
      <div className="display text-lg sm:text-xl mb-2 text-text">{title}</div>
      <p className="text-sm text-text-dim leading-relaxed">{body}</p>
    </div>
  );
}
