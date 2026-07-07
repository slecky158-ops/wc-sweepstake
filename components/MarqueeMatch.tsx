import Link from 'next/link';
import { getTeam, getEntrantForTeam, formatTimeUK, formatDateUK } from '@/lib/data';
import type { Match } from '@/lib/types';
import type { LiveState } from '@/lib/live';
import { isMatchLive, ROUND_LABEL } from '@/lib/knockout';

interface Props {
  match: Match;
  live?: LiveState;
  factHome?: string;
  factAway?: string;
}

export function MarqueeMatch({ match, live, factHome, factAway }: Props) {
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const eA = getEntrantForTeam(match.teamA);
  const eB = getEntrantForTeam(match.teamB);
  if (!a || !b) return null;

  const isLive = (live?.isLive ?? false) || isMatchLive(match);
  const done = match.status === 'completed' && !!match.result;
  const roundLabel = match.round ? ROUND_LABEL[match.round] : (match.stage === 'group' ? `Group ${match.group}` : 'Knockout');

  const scoreA = live?.isLive ? live.scoreA : (done ? match.result!.scoreA : null);
  const scoreB = live?.isLive ? live.scoreB : (done ? match.result!.scoreB : null);
  const liveMinute = live?.isLive
    ? (live.status === 'PAUSED' ? 'HT' : live.status === 'EXTRA_TIME' ? 'ET' : live.status === 'PENALTY_SHOOTOUT' ? 'PEN' : (live.minute != null ? `${live.minute}'` : 'LIVE'))
    : null;

  // Prize hint: for F it's £100; for SF it's still £100 (need to win 2 more); leave generic
  const prizeHint = match.round === 'F' ? '£100 jersey' :
                    match.round === '3rd' ? '£15 · 3rd place' :
                    match.round === 'SF' ? '2 wins from £100' :
                    match.round === 'QF' ? '3 wins from £100' :
                    '4 wins from £100';

  return (
    <article className="marquee">
      <div className="marquee-glow marquee-glow--left" aria-hidden="true" />
      <div className="marquee-glow marquee-glow--right" aria-hidden="true" />

      <div className="marquee-eyebrow">
        {isLive && !done ? (
          <span className="marquee-pill marquee-pill--live">
            <span className="marquee-pulse" />
            LIVE {liveMinute}
          </span>
        ) : done ? (
          <span className="marquee-pill marquee-pill--done">FULL TIME</span>
        ) : (
          <span className="marquee-pill marquee-pill--time">
            {formatDateUK(match.kickoffUk).toUpperCase()} · {formatTimeUK(match.kickoffUk)} UK
          </span>
        )}
        <span className="marquee-round">{roundLabel.toUpperCase()}</span>
      </div>

      {/* Face-off */}
      <div className="marquee-faceoff">
        <Link href={`/matches?country=${a.code}`} className="marquee-side">
          <div className="marquee-flag">{a.flag}</div>
          <div className="marquee-team">{a.name}</div>
          {eA && <div className="marquee-owner">{eA.name.toUpperCase()}</div>}
        </Link>

        <div className="marquee-centre">
          {(scoreA != null && scoreB != null) ? (
            <div className="marquee-score">
              {scoreA}<span className="marquee-score-sep">·</span>{scoreB}
            </div>
          ) : (
            <div className="marquee-vs">vs</div>
          )}
          {match.venue && (
            <div className="marquee-venue">{match.venue.stadium}</div>
          )}
        </div>

        <Link href={`/matches?country=${b.code}`} className="marquee-side">
          <div className="marquee-flag">{b.flag}</div>
          <div className="marquee-team">{b.name}</div>
          {eB && <div className="marquee-owner">{eB.name.toUpperCase()}</div>}
        </Link>
      </div>

      {/* Meta pills */}
      <div className="marquee-meta">
        {match.broadcast && (
          <span className="marquee-metapill">📺 {match.broadcast.uk} · {match.broadcast.us}</span>
        )}
        {match.weather && (
          <span className="marquee-metapill">☁️ {match.weather.split(' · ').slice(0, 2).join(' · ')}</span>
        )}
        {match.venue?.city && (
          <span className="marquee-metapill">📍 {match.venue.city}</span>
        )}
      </div>

      {/* Stakes bar */}
      <div className="marquee-stakes">
        <div className="marquee-stakes-label">Money on the line</div>
        <div className="marquee-stakes-grid">
          <div className="marquee-stake marquee-stake--a">
            <div className="marquee-stake-tag">IF {a.code} WIN</div>
            <div className="marquee-stake-name">
              {eA ? <>{eA.name} <span className="marquee-stake-hint">→ {prizeHint}</span></> : '—'}
            </div>
          </div>
          <div className="marquee-stake marquee-stake--b">
            <div className="marquee-stake-tag">IF {b.code} WIN</div>
            <div className="marquee-stake-name">
              {eB ? <>{eB.name} <span className="marquee-stake-hint">→ {prizeHint}</span></> : '—'}
            </div>
          </div>
        </div>
      </div>

      {(factHome || factAway) && (
        <div className="marquee-fact">
          {factHome || factAway}
        </div>
      )}
    </article>
  );
}
