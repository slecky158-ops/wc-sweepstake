import Link from 'next/link';
import { getTeam, getEntrantForTeam } from '@/lib/data';
import type { DailyMatch, Storyline } from '@/lib/types';

interface Props {
  matches: DailyMatch[];
  storyline: Storyline | null;
}

export function YesterdayDrama({ matches, storyline }: Props) {
  if (!matches.length) return null;

  // Pick the "biggest" story — largest goal difference, then latest kickoff
  const featured = [...matches]
    .filter(m => m.scoreA != null && m.scoreB != null)
    .sort((a, b) => {
      const diffA = Math.abs((a.scoreA ?? 0) - (a.scoreB ?? 0));
      const diffB = Math.abs((b.scoreA ?? 0) - (b.scoreB ?? 0));
      if (diffA !== diffB) return diffB - diffA;
      return (b.kickoffUk ?? '').localeCompare(a.kickoffUk ?? '');
    })[0] ?? matches[0];

  const a = getTeam(featured.teamA);
  const b = getTeam(featured.teamB);
  const winnerCode = (featured.scoreA ?? 0) > (featured.scoreB ?? 0) ? featured.teamA :
                     (featured.scoreB ?? 0) > (featured.scoreA ?? 0) ? featured.teamB : null;
  const winnerEntrant = winnerCode ? getEntrantForTeam(winnerCode) : null;
  const analysisLine = featured.analysis?.lines?.[0] ?? featured.scorers ?? null;

  return (
    <section className="drama">
      <div className="drama-head">
        <div>
          <div className="drama-title">Yesterday</div>
          {storyline && <div className="drama-storyline">{storyline.headline}</div>}
        </div>
        <Link href={`/?date=${dateKeyFromIso(featured.kickoffUk)}`} className="drama-more">Full recap →</Link>
      </div>

      <article className="drama-card">
        <div className="drama-teams">
          <div className="drama-team">
            <span className="drama-flag">{a?.flag ?? '—'}</span>
            <span className="drama-name">{a?.name ?? featured.teamA}</span>
          </div>
          <div className="drama-score">
            <span className={winnerCode === featured.teamA ? 'drama-score-win' : ''}>{featured.scoreA}</span>
            <span className="drama-score-sep">·</span>
            <span className={winnerCode === featured.teamB ? 'drama-score-win' : ''}>{featured.scoreB}</span>
          </div>
          <div className="drama-team">
            <span className="drama-flag">{b?.flag ?? '—'}</span>
            <span className="drama-name">{b?.name ?? featured.teamB}</span>
          </div>
        </div>

        {analysisLine && (
          <div className="drama-quote">{analysisLine}</div>
        )}

        {winnerEntrant && (
          <div className="drama-stakes">
            <span className="drama-stakes-tag">WIN CARRIES</span>
            <span className="drama-stakes-name">{winnerEntrant.name} → still in the chase</span>
          </div>
        )}

        {matches.length > 1 && (
          <div className="drama-others">
            {matches.filter(m => m.matchId !== featured.matchId).map(m => {
              const ma = getTeam(m.teamA);
              const mb = getTeam(m.teamB);
              return (
                <div key={m.matchId} className="drama-other">
                  <span>{ma?.flag} {m.teamA}</span>
                  <span className="drama-other-score">{m.scoreA} – {m.scoreB}</span>
                  <span>{mb?.flag} {m.teamB}</span>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}

function dateKeyFromIso(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}
