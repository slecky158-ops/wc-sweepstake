import { matches, entrants, getTeam, getEntrantForTeam, getEntrant } from './data';
import type { Match, KnockoutRound, Entrant } from './types';

// Round ordering for "how far advanced?" computations
const ROUND_ORDER: Record<KnockoutRound, number> = {
  'R32': 1, 'R16': 2, 'QF': 3, 'SF': 4, '3rd': 5, 'F': 5,
};

const PRIZE_BY_ROUND: Record<string, number> = {
  R32: 0, R16: 0, QF: 15, SF: 30, F: 100, '3rd': 15,
};

export interface StillAliveEntrant {
  entrant: Entrant;
  teamCode: string;
  currentRound: KnockoutRound;   // furthest round they've already won through
  nextRound: KnockoutRound | null; // where they play next
  isPlayingNow: boolean;           // has a live match right now
  nextMatch: Match | null;
  liveMatch: Match | null;
  maxPrize: number;                // max cash if their team wins the whole thing (excludes non-progression awards)
  awardsWon: string[];             // titles of awards already banked (for the pip stack)
}

/** True if the tournament is in a stage where the bracket is meaningful. */
export function isKnockoutPhase(): boolean {
  return matches.some(m =>
    m.stage === 'knockout' &&
    m.teamA && m.teamB &&
    (m.status === 'completed' || m.status === 'live' || (m.kickoffUk && new Date(m.kickoffUk).getTime() < Date.now() + 6 * 24 * 3600 * 1000)),
  );
}

/** All knockout matches keyed by round, sorted by kickoff. */
export function getKnockoutMatchesByRound(): Record<KnockoutRound, Match[]> {
  const out = { R32: [], R16: [], QF: [], SF: [], '3rd': [], F: [] } as Record<KnockoutRound, Match[]>;
  for (const m of matches) {
    if (m.stage !== 'knockout' || !m.round) continue;
    if (!m.teamA && !m.teamB && !m.kickoffUk) continue;
    out[m.round].push(m);
  }
  for (const k of Object.keys(out) as KnockoutRound[]) {
    out[k].sort((a, b) => (a.kickoffUk ?? '').localeCompare(b.kickoffUk ?? ''));
  }
  return out;
}

/** Team codes eliminated by losing a completed knockout match. */
export function getEliminatedTeams(): Set<string> {
  const dead = new Set<string>();
  for (const m of matches) {
    if (m.stage !== 'knockout' || !m.result) continue;
    if (!m.teamA || !m.teamB) continue;
    const { scoreA, scoreB } = m.result;
    if (scoreA === scoreB) continue; // knockouts can't draw (ignore ET/pen for now)
    const loser = scoreA > scoreB ? m.teamB : m.teamA;
    dead.add(loser);
  }
  return dead;
}

/** Which round is a given team currently AT (i.e. next to play, or eliminated)? */
export function currentRoundForTeam(teamCode: string): { currentRound: KnockoutRound; nextRound: KnockoutRound | null; eliminated: boolean } {
  const dead = getEliminatedTeams();
  if (dead.has(teamCode)) {
    return { currentRound: 'R16', nextRound: null, eliminated: true };
  }
  // Find the highest round match this team has already WON through
  const wins = matches.filter(m =>
    m.stage === 'knockout' && m.result &&
    (m.teamA === teamCode || m.teamB === teamCode) &&
    winnerOf(m) === teamCode,
  );
  const highestWinRound = wins
    .map(m => m.round)
    .filter((r): r is KnockoutRound => !!r)
    .sort((a, b) => ROUND_ORDER[b] - ROUND_ORDER[a])[0];

  // Their "current stage" is the next round after their highest win, or R16 if no wins
  const roundOrderList: KnockoutRound[] = ['R32', 'R16', 'QF', 'SF', 'F'];
  const idx = highestWinRound ? roundOrderList.indexOf(highestWinRound) : -1;
  const nextRound = roundOrderList[idx + 1] ?? null;
  return { currentRound: highestWinRound ?? 'R16', nextRound, eliminated: false };
}

function winnerOf(m: Match): string | null {
  if (!m.result || !m.teamA || !m.teamB) return null;
  if (m.result.scoreA > m.result.scoreB) return m.teamA;
  if (m.result.scoreB > m.result.scoreA) return m.teamB;
  return null;
}

/** True if the given match is happening right now (kicked off within 3h and not completed). */
export function isMatchLive(m: Match): boolean {
  if (!m.kickoffUk || m.status === 'completed') return false;
  const ko = new Date(m.kickoffUk).getTime();
  const now = Date.now();
  return ko <= now && now - ko < 3 * 3600 * 1000;
}

/** List of remaining entrants sorted by "closest to trophy" then max prize. */
export function getStillAliveEntrants(): StillAliveEntrant[] {
  const eliminated = getEliminatedTeams();
  const list: StillAliveEntrant[] = [];
  for (const e of entrants) {
    for (const teamCode of [e.teamA, e.teamB]) {
      if (eliminated.has(teamCode)) continue;
      // Only count teams that have made it into the knockout data (i.e. have a knockout match)
      const anyKO = matches.some(m =>
        m.stage === 'knockout' && (m.teamA === teamCode || m.teamB === teamCode),
      );
      if (!anyKO) continue;

      const { currentRound, nextRound } = currentRoundForTeam(teamCode);

      // Next scheduled match for this team
      const upcoming = matches
        .filter(m => m.stage === 'knockout' && !m.result && (m.teamA === teamCode || m.teamB === teamCode))
        .sort((a, b) => (a.kickoffUk ?? '').localeCompare(b.kickoffUk ?? ''))[0] ?? null;

      const live = matches.find(m =>
        m.stage === 'knockout' &&
        (m.teamA === teamCode || m.teamB === teamCode) &&
        isMatchLive(m),
      ) ?? null;

      list.push({
        entrant: e,
        teamCode,
        currentRound,
        nextRound,
        isPlayingNow: !!live,
        nextMatch: upcoming,
        liveMatch: live,
        maxPrize: 100,       // simplification: any surviving team could win the trophy
        awardsWon: [],       // populated at render time from awards.json
      });
    }
  }
  // Sort: playing-now first, then by round order (F > SF > QF > R16), then by entrant name
  return list.sort((a, b) => {
    if (a.isPlayingNow !== b.isPlayingNow) return a.isPlayingNow ? -1 : 1;
    const rA = ROUND_ORDER[a.currentRound] ?? 0;
    const rB = ROUND_ORDER[b.currentRound] ?? 0;
    if (rA !== rB) return rB - rA;
    return a.entrant.name.localeCompare(b.entrant.name);
  });
}

/** Pick THE match to show in the marquee. Priority: live > next-up > most-recent-result. */
export function pickMarqueeMatch(): Match | null {
  const ko = matches.filter(m => m.stage === 'knockout' && m.teamA && m.teamB && m.kickoffUk);
  const live = ko.find(m => isMatchLive(m));
  if (live) return live;
  const now = Date.now();
  const upcoming = ko
    .filter(m => !m.result && new Date(m.kickoffUk!).getTime() > now)
    .sort((a, b) => (a.kickoffUk ?? '').localeCompare(b.kickoffUk ?? ''))[0];
  if (upcoming) return upcoming;
  const recent = ko
    .filter(m => m.result)
    .sort((a, b) => (b.kickoffUk ?? '').localeCompare(a.kickoffUk ?? ''))[0];
  return recent ?? null;
}

/** Human labels for round codes. */
export const ROUND_LABEL: Record<KnockoutRound, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter final',
  SF: 'Semi final',
  '3rd': '3rd-place playoff',
  F: 'Final',
};

export const ROUND_SHORT: Record<KnockoutRound, string> = {
  R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', '3rd': '3rd', F: 'F',
};
