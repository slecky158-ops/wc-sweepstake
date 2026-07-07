import Link from 'next/link';
import { getTeam, awards } from '@/lib/data';
import type { StillAliveEntrant } from '@/lib/knockout';
import { ROUND_SHORT } from '@/lib/knockout';

interface Props {
  entries: StillAliveEntrant[];
}

const STAGES = ['R16', 'QF', 'SF', 'F'] as const;

// Segmented step-bar — each of the 4 knockout stages, filled if the team has ADVANCED past it.
function StepBar({ entry }: { entry: StillAliveEntrant }) {
  const wonIdx = entry.furthestWonRound ? STAGES.indexOf(entry.furthestWonRound as (typeof STAGES)[number]) : -1;
  const liveIdx = entry.isPlayingNow && entry.upcomingRound
    ? STAGES.indexOf(entry.upcomingRound as (typeof STAGES)[number])
    : -1;

  return (
    <div className="chase-steps">
      {STAGES.map((label, i) => {
        const won = i <= wonIdx;
        const live = i === liveIdx;
        return <div key={label} className={`chase-step ${won ? 'chase-step--won' : ''} ${live ? 'chase-step--live' : ''}`} />;
      })}
    </div>
  );
}

function awardsWonBySlug(slug: string): Array<{ title: string; prize: string }> {
  return awards
    .filter(a => a.winnerEntrant === slug)
    .map(a => ({ title: a.title, prize: a.prize }));
}

// Small human phrase describing where they are in the bracket.
function progressText(entry: StillAliveEntrant): string {
  if (entry.isPlayingNow) return 'PLAYING NOW';
  if (!entry.upcomingRound && entry.furthestWonRound === 'F') return 'CHAMPIONS';
  if (entry.furthestWonRound && entry.upcomingRound) {
    return `${ROUND_SHORT[entry.furthestWonRound]} ✓ · ${ROUND_SHORT[entry.upcomingRound]} next`;
  }
  if (entry.upcomingRound) return `${ROUND_SHORT[entry.upcomingRound]} up next`;
  if (entry.furthestWonRound) return `${ROUND_SHORT[entry.furthestWonRound]} ✓`;
  return 'IN THE HUNT';
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
              <div className="chase-card-badge">THE JERSEY</div>
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
              <div className="chase-card-round">{progressText(entry)}</div>
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
