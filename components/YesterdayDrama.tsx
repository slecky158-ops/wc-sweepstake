import Link from 'next/link';
import { getTeam, getEntrantForTeam } from '@/lib/data';
import type { DailyMatch, Storyline } from '@/lib/types';

interface Props {
  matches: DailyMatch[];
  storyline: Storyline | null;
}

function DramaCard({ m }: { m: DailyMatch }) {
  const a = getTeam(m.teamA);
  const b = getTeam(m.teamB);
  const scoreA = m.scoreA ?? 0;
  const scoreB = m.scoreB ?? 0;
  const winnerCode = scoreA > scoreB ? m.teamA : scoreB > scoreA ? m.teamB : null;
  const winnerEntrant = winnerCode ? getEntrantForTeam(winnerCode) : null;
  const analysisLine = m.analysis?.lines?.[0] ?? m.scorers ?? null;

  return (
    <article className="drama-card">
      <div className="drama-teams">
        <div className="drama-team">
          <span className="drama-flag">{a?.flag ?? '—'}</span>
          <span className="drama-name">{a?.name ?? m.teamA}</span>
        </div>
        <div className="drama-score">
          <span className={winnerCode === m.teamA ? 'drama-score-win' : ''}>{scoreA}</span>
          <span className="drama-score-sep">·</span>
          <span className={winnerCode === m.teamB ? 'drama-score-win' : ''}>{scoreB}</span>
        </div>
        <div className="drama-team">
          <span className="drama-flag">{b?.flag ?? '—'}</span>
          <span className="drama-name">{b?.name ?? m.teamB}</span>
        </div>
      </div>

      {analysisLine && <div className="drama-quote">{analysisLine}</div>}

      {winnerEntrant && (
        <div className="drama-stakes">
          <span className="drama-stakes-tag">WIN CARRIES</span>
          <span className="drama-stakes-name">{winnerEntrant.name} → still in the chase</span>
        </div>
      )}
    </article>
  );
}

export function YesterdayDrama({ matches, storyline }: Props) {
  if (!matches.length) return null;
  // Show ALL yesterday matches as equal cards, latest kickoff first
  const ordered = [...matches].sort((a, b) => (b.kickoffUk ?? '').localeCompare(a.kickoffUk ?? ''));
  const firstKickoff = ordered[0]?.kickoffUk;
  return (
    <section className="drama">
      <div className="drama-head">
        <div>
          <div className="drama-title">Yesterday</div>
          {storyline && <div className="drama-storyline">{storyline.headline}</div>}
        </div>
        <Link href={firstKickoff ? `/?date=${dateKeyFromIso(firstKickoff)}` : '/matches'} className="drama-more">Full recap →</Link>
      </div>
      <div className="drama-list">
        {ordered.map(m => <DramaCard key={m.matchId} m={m} />)}
      </div>
    </section>
  );
}

function dateKeyFromIso(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}
