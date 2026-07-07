import Link from 'next/link';
import { getTeam, awards } from '@/lib/data';
import type { StillAliveEntrant } from '@/lib/knockout';
import { ROUND_SHORT } from '@/lib/knockout';

interface Props {
  entries: StillAliveEntrant[];
}

// Segmented step-bar for the entrant's team's progress
function StepBar({ entry }: { entry: StillAliveEntrant }) {
  // 4 segments: R16, QF, SF, F
  const stages: Array<{ label: string; won: boolean; live: boolean }> = [
    { label: 'R16', won: entry.currentRound === 'R16' || entry.currentRound === 'QF' || entry.currentRound === 'SF' || entry.currentRound === 'F', live: entry.isPlayingNow && entry.nextRound === 'QF' },
    { label: 'QF',  won: entry.currentRound === 'QF' || entry.currentRound === 'SF' || entry.currentRound === 'F',  live: entry.isPlayingNow && entry.nextRound === 'SF' },
    { label: 'SF',  won: entry.currentRound === 'SF' || entry.currentRound === 'F',                                  live: entry.isPlayingNow && entry.nextRound === 'F' },
    { label: 'F',   won: entry.currentRound === 'F',                                                                  live: entry.isPlayingNow && entry.nextRound === null },
  ];
  return (
    <div className="chase-steps">
      {stages.map(s => (
        <div key={s.label} className={`chase-step ${s.won ? 'chase-step--won' : ''} ${s.live ? 'chase-step--live' : ''}`} />
      ))}
    </div>
  );
}

function awardsWonBySlug(slug: string): Array<{ title: string; prize: string }> {
  return awards
    .filter(a => a.winnerEntrant === slug)
    .map(a => ({ title: a.title, prize: a.prize }));
}

export function ChaseRail({ entries }: Props) {
  if (!entries.length) return null;
  return (
    <section className="chase">
      <div className="chase-head">
        <div>
          <div className="chase-title">The chase</div>
          <div className="chase-sub">Still alive · {entries.length} of 24</div>
        </div>
        <div className="chase-hint">swipe →</div>
      </div>

      <div className="chase-rail">
        {entries.map((entry, i) => {
          const team = getTeam(entry.teamCode);
          if (!team) return null;
          const wins = awardsWonBySlug(entry.entrant.slug);
          return (
            <Link
              key={entry.entrant.slug + '-' + entry.teamCode}
              href={`/entrants/${entry.entrant.slug}`}
              className={`chase-card ${entry.isPlayingNow ? 'chase-card--live' : ''}`}
            >
              <div className="chase-card-badge">UP TO £100</div>
              {entry.isPlayingNow && (
                <div className="chase-card-livepill">
                  <span className="chase-card-pulse" />
                  PLAYING NOW
                </div>
              )}
              <div className="chase-card-head">
                <span className="chase-card-rank">#{i + 1}</span>
                <span className="chase-card-flag">{team.flag}</span>
              </div>
              <div className="chase-card-name">{entry.entrant.name}</div>
              <div className="chase-card-team">{team.name} · {team.code}</div>
              <StepBar entry={entry} />
              <div className="chase-card-round">
                {entry.isPlayingNow
                  ? 'IN PROGRESS'
                  : entry.currentRound === 'F'
                    ? 'IN FINAL'
                    : `${ROUND_SHORT[entry.currentRound]} ✓ · ${entry.nextRound ? ROUND_SHORT[entry.nextRound] + ' next' : 'CHAMPION'}`}
              </div>
              {wins.length > 0 && (
                <div className="chase-card-wins">
                  {wins.slice(0, 2).map((w, j) => (
                    <span key={j} className="chase-card-win">✓ {w.prize}</span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
        <div className="chase-tail">
          <Link href="/entrants" className="chase-tail-link">All 24 →</Link>
        </div>
      </div>
    </section>
  );
}
