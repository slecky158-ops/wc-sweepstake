import Link from 'next/link';
import { getTeam, getEntrantForTeam, formatTimeUK, formatDateUK } from '@/lib/data';
import type { Match, KnockoutRound } from '@/lib/types';
import { getKnockoutMatchesByRound, isMatchLive, ROUND_LABEL } from '@/lib/knockout';

// A compact match tile — designed to look clean when listed by round,
// deliberately NOT drawing bracket connector lines (which look messy on mobile).
function MatchTile({ m }: { m: Match }) {
  const a = getTeam(m.teamA);
  const b = getTeam(m.teamB);
  const eA = getEntrantForTeam(m.teamA);
  const eB = getEntrantForTeam(m.teamB);
  const done = m.status === 'completed' && !!m.result;
  const live = isMatchLive(m);

  const winnerA = done && m.result!.scoreA > m.result!.scoreB;
  const winnerB = done && m.result!.scoreB > m.result!.scoreA;

  const teamLabel = (
    isWinner: boolean,
    isLoser: boolean,
    flag: string | undefined,
    name: string | undefined,
    code: string | undefined,
    entrantName: string | undefined,
  ) => (
    <div className={`kmap-tile-row ${isWinner ? 'kmap-tile-row--won' : ''} ${isLoser ? 'kmap-tile-row--lost' : ''}`}>
      <span className="kmap-tile-flag">{flag ?? '—'}</span>
      <span className="kmap-tile-team">{name ?? code ?? 'TBD'}</span>
      {entrantName && <span className="kmap-tile-owner">{entrantName}</span>}
    </div>
  );

  return (
    <div className={`kmap-tile ${done ? 'kmap-tile--done' : ''} ${live ? 'kmap-tile--live' : ''}`}>
      <div className="kmap-tile-teams">
        {teamLabel(winnerA, winnerB, a?.flag, a?.name, m.teamA ?? undefined, eA?.name)}
        {teamLabel(winnerB, winnerA, b?.flag, b?.name, m.teamB ?? undefined, eB?.name)}
      </div>
      <div className="kmap-tile-side">
        {live ? (
          <span className="kmap-tile-live"><span className="kmap-tile-live-dot" />LIVE</span>
        ) : done && m.result ? (
          <div className="kmap-tile-score">
            <div>{m.result.scoreA}</div>
            <div>{m.result.scoreB}</div>
          </div>
        ) : (
          <div className="kmap-tile-time">
            <div className="kmap-tile-time-date">{formatDateUK(m.kickoffUk).split(' ')[0]}</div>
            <div className="kmap-tile-time-hm">{formatTimeUK(m.kickoffUk)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoundSection({ round, matches }: { round: KnockoutRound; matches: Match[] }) {
  if (!matches.length) return null;
  const doneCount = matches.filter(m => m.status === 'completed').length;
  const total = matches.length;
  return (
    <div className="kmap-round">
      <div className="kmap-round-head">
        <div className="kmap-round-title">{ROUND_LABEL[round]}</div>
        <div className="kmap-round-progress">{doneCount}/{total}</div>
      </div>
      <div className="kmap-round-list">
        {matches.map(m => <MatchTile key={m.id} m={m} />)}
      </div>
    </div>
  );
}

export function KnockoutMap() {
  const byRound = getKnockoutMatchesByRound();
  return (
    <section className="kmap">
      <div className="kmap-head">
        <div>
          <div className="kmap-title">Knockout map</div>
          <div className="kmap-sub">R16 · QF · SF · Final</div>
        </div>
        <Link href="/matches" className="kmap-more">Full fixtures →</Link>
      </div>
      <RoundSection round="R16" matches={byRound.R16} />
      <RoundSection round="QF"  matches={byRound.QF} />
      <RoundSection round="SF"  matches={byRound.SF} />
      <RoundSection round="3rd" matches={byRound['3rd']} />
      <RoundSection round="F"   matches={byRound.F} />
    </section>
  );
}
