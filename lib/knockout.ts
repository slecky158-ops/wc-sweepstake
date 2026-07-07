import { matches, entrants } from './data';
import type { Match, KnockoutRound, Entrant } from './types';

// Round ordering — R32 first, F last
const ROUND_ORDER: Record<KnockoutRound, number> = {
  'R32': 1, 'R16': 2, 'QF': 3, 'SF': 4, '3rd': 5, 'F': 5,
};

// Round of a MATCH → how many more wins its winner needs to lift the jersey
// (i.e. wins remaining AFTER winning this round; 0 = you've just won the Final)
const WINS_REMAINING_AFTER: Record<KnockoutRound, number> = {
  R32: 4, R16: 3, QF: 2, SF: 1, F: 0, '3rd': 0,
};

export interface StillAliveEntrant {
  entrant: Entrant;
  teamCode: string;
  furthestWonRound: KnockoutRound | null; // most-advanced round they've WON (null = haven't won any knockout yet)
  upcomingRound: KnockoutRound | null;    // round of their next scheduled match
  isPlayingNow: boolean;
  nextMatch: Match | null;
  liveMatch: Match | null;
  awardsWon: string[];             // populated at render time from awards.json
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
    if (scoreA === scoreB) continue; // ignore ET/pen for now
    const loser = scoreA > scoreB ? m.teamB : m.teamA;
    dead.add(loser);
  }
  return dead;
}

function winnerOf(m: Match): string | null {
  if (!m.result || !m.teamA || !m.teamB) return null;
  if (m.result.scoreA > m.result.scoreB) return m.teamA;
  if (m.result.scoreB > m.result.scoreA) return m.teamB;
  return null;
}

/** Furthest round a team has WON, plus the round of their next scheduled match. */
export function progressForTeam(teamCode: string): {
  furthestWonRound: KnockoutRound | null;
  upcomingRound: KnockoutRound | null;
  eliminated: boolean;
} {
  const dead = getEliminatedTeams();
  if (dead.has(teamCode)) return { furthestWonRound: null, upcomingRound: null, eliminated: true };
  const wins = matches.filter(m =>
    m.stage === 'knockout' && m.result &&
    (m.teamA === teamCode || m.teamB === teamCode) &&
    winnerOf(m) === teamCode,
  );
  const furthestWonRound = wins
    .map(m => m.round)
    .filter((r): r is KnockoutRound => !!r)
    .sort((a, b) => ROUND_ORDER[b] - ROUND_ORDER[a])[0] ?? null;

  const upcomingMatch = matches
    .filter(m => m.stage === 'knockout' && !m.result && (m.teamA === teamCode || m.teamB === teamCode))
    .sort((a, b) => (a.kickoffUk ?? '').localeCompare(b.kickoffUk ?? ''))[0];
  const upcomingRound = upcomingMatch?.round ?? null;

  return { furthestWonRound, upcomingRound, eliminated: false };
}

/** True if the given match is happening right now (kicked off within 3h and not completed). */
export function isMatchLive(m: Match): boolean {
  if (!m.kickoffUk || m.status === 'completed') return false;
  const ko = new Date(m.kickoffUk).getTime();
  const now = Date.now();
  return ko <= now && now - ko < 3 * 3600 * 1000;
}

/** List of remaining entrants sorted by "closest to trophy" then playing-now-first. */
export function getStillAliveEntrants(): StillAliveEntrant[] {
  const eliminated = getEliminatedTeams();
  const list: StillAliveEntrant[] = [];
  for (const e of entrants) {
    for (const teamCode of [e.teamA, e.teamB]) {
      if (eliminated.has(teamCode)) continue;
      const anyKO = matches.some(m =>
        m.stage === 'knockout' && (m.teamA === teamCode || m.teamB === teamCode),
      );
      if (!anyKO) continue;

      const { furthestWonRound, upcomingRound } = progressForTeam(teamCode);

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
        furthestWonRound,
        upcomingRound,
        isPlayingNow: !!live,
        nextMatch: upcoming,
        liveMatch: live,
        awardsWon: [],
      });
    }
  }
  // Sort: playing-now first, then by furthest-won round (F best), then by entrant name
  return list.sort((a, b) => {
    if (a.isPlayingNow !== b.isPlayingNow) return a.isPlayingNow ? -1 : 1;
    const rA = a.furthestWonRound ? ROUND_ORDER[a.furthestWonRound] : 0;
    const rB = b.furthestWonRound ? ROUND_ORDER[b.furthestWonRound] : 0;
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

/** How many wins remain to lift the jersey after winning a match at the given round. */
export function winsRemainingAfter(round: KnockoutRound | null | undefined): number | null {
  if (!round) return null;
  return WINS_REMAINING_AFTER[round] ?? null;
}

/** Short human phrase for "wins remaining until the jersey" (0 = "the jersey"). */
export function jerseyProximity(round: KnockoutRound | null | undefined): string {
  const n = winsRemainingAfter(round);
  if (n == null) return 'still in it';
  if (n === 0) return 'lifts the jersey';
  if (n === 1) return '1 win from the jersey';
  return `${n} wins from the jersey`;
}

/**
 * Per-match, per-team stakes — hand-curated where possible to add
 * personality (references to open awards, storylines, players).
 * Falls back to jersey-proximity when no override is set.
 */
const STAKES_OVERRIDE: Record<string, { home?: string; away?: string }> = {
  // R16 — today
  K023: { // ARG vs EGY
    home: 'Joe advances to QF · Messi still hunting the golden boot',
    away: 'Andrew R springs a shock · Salah writes a redemption arc',
  },
  K024: { // SUI vs COL
    home: 'Andrew N reaches his first-ever QF · Sommer eyes a clean sheet',
    away: 'James → QF · Colombia dark-horse run rolls on',
  },
  // QF — this weekend
  K025: { // FRA vs MAR
    home: 'Peter → SF · Olise already banked £5 for assists',
    away: 'Sam W → SF · Morocco fairytale keeps writing itself',
  },
  K026: { // ESP vs BEL
    home: "Ned → SF · already sitting on £7.50 for Spain's clean sheets",
    away: "Tom → SF · already banked £15 (Trump-bash + child-cry)",
  },
  K027: { // NOR vs ENG
    home: "Austin → SF · Haaland still on for the boot",
    away: "Spoff → SF · England's first WC SF since 1990",
  },
  K028: { // QF4 — teams TBD
    home: '→ SF · 2 wins from the jersey',
    away: '→ SF · 2 wins from the jersey',
  },
};

/** Return the stakes line for one side of one match. */
export function stakesForMatch(match: Match, side: 'home' | 'away'): string {
  const override = STAKES_OVERRIDE[match.id]?.[side];
  if (override) return override;
  // Fallback based on round + jersey proximity
  const roundLabel = match.round === '3rd'
    ? '3rd place · £15'
    : match.round === 'F'
      ? 'lifts the jersey'
      : jerseyProximity(match.round);
  return `→ ${roundLabel}`;
}

/** Human labels. */
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
