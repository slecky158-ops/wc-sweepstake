/**
 * Live-score fetch from football-data.org (free tier).
 *
 * Called server-side on every page render. Next.js caches the result for 60s
 * so we hit the API at most once per minute regardless of visitor count.
 * That stays well under the 100/day free quota.
 *
 * Returns a Map of our matchId → live state. The site merges this into the
 * static fixture data so cards can show LIVE 67' / current score for matches
 * currently in progress.
 */

const COMP = 'WC'; // FIFA World Cup
const ENDPOINT = `https://api.football-data.org/v4/competitions/${COMP}/matches`;

export type LiveStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'EXTRA_TIME'
  | 'PENALTY_SHOOTOUT'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface LiveState {
  status: LiveStatus;
  scoreA: number | null;
  scoreB: number | null;
  minute: number | null;
  isLive: boolean;
}

// Map football-data.org team names → our 3-letter codes (data/teams.json).
// Covers spellings that differ from ours.
const TEAM_NAME_TO_CODE: Record<string, string> = {
  // Group A
  'Mexico': 'MEX',
  'South Korea': 'KOR',
  'Korea Republic': 'KOR',
  'Czechia': 'CZE',
  'Czech Republic': 'CZE',
  'South Africa': 'RSA',
  // Group B
  'Switzerland': 'SUI',
  'Canada': 'CAN',
  'Qatar': 'QAT',
  'Bosnia-Herzegovina': 'BIH',
  'Bosnia and Herzegovina': 'BIH',
  // Group C
  'Brazil': 'BRA',
  'Morocco': 'MAR',
  'Scotland': 'SCO',
  'Haiti': 'HAI',
  // Group D
  'United States': 'USA',
  'USA': 'USA',
  'Türkiye': 'TUR',
  'Turkey': 'TUR',
  'Australia': 'AUS',
  'Paraguay': 'PAR',
  // Group E
  'Germany': 'GER',
  'Ecuador': 'ECU',
  'Ivory Coast': 'CIV',
  "Côte d'Ivoire": 'CIV',
  'Curaçao': 'CUW',
  // Group F
  'Netherlands': 'NED',
  'Japan': 'JPN',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL',
  'Egypt': 'EGY',
  'Iran': 'IRN',
  'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP',
  'Uruguay': 'URU',
  'Saudi Arabia': 'KSA',
  'Cape Verde': 'CPV',
  'Cabo Verde': 'CPV',
  // Group I
  'France': 'FRA',
  'Norway': 'NOR',
  'Senegal': 'SEN',
  'Iraq': 'IRQ',
  // Group J
  'Argentina': 'ARG',
  'Austria': 'AUT',
  'Algeria': 'ALG',
  'Jordan': 'JOR',
  // Group K
  'Portugal': 'POR',
  'Colombia': 'COL',
  'DR Congo': 'COD',
  'Democratic Republic of the Congo': 'COD',
  'Congo DR': 'COD',
  'Uzbekistan': 'UZB',
  // Group L
  'England': 'ENG',
  'Croatia': 'CRO',
  'Ghana': 'GHA',
  'Panama': 'PAN',
};

function codeFor(name: string | undefined): string | null {
  if (!name) return null;
  return TEAM_NAME_TO_CODE[name] ?? TEAM_NAME_TO_CODE[name.trim()] ?? null;
}

const LIVE_STATUSES: LiveStatus[] = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'];

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: LiveStatus;
  minute?: number | null;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  score?: {
    fullTime?: { home: number | null; away: number | null };
    regularTime?: { home: number | null; away: number | null };
  };
}

/**
 * Fetch all WC matches from football-data.org and return a Map keyed by
 * "TEAMA|TEAMB|YYYY-MM-DD" (UTC) for downstream matching.
 *
 * Returns an empty Map if the API key is missing or the request fails —
 * the site renders fine without live data in that case.
 */
export async function getLiveScores(): Promise<Map<string, LiveState>> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return new Map();
  try {
    const res = await fetch(ENDPOINT, {
      headers: { 'X-Auth-Token': key },
      next: { revalidate: 60 }, // cache 60s = max 60 calls/hour
    });
    if (!res.ok) return new Map();
    const data = await res.json();
    const matches: FootballDataMatch[] = data?.matches ?? [];
    const out = new Map<string, LiveState>();
    for (const m of matches) {
      const a = codeFor(m.homeTeam?.name);
      const b = codeFor(m.awayTeam?.name);
      if (!a || !b) continue;
      const utcDay = m.utcDate?.slice(0, 10);
      if (!utcDay) continue;
      const key1 = `${a}|${b}|${utcDay}`;
      const key2 = `${b}|${a}|${utcDay}`;
      const scoreA = m.score?.fullTime?.home ?? m.score?.regularTime?.home ?? null;
      const scoreB = m.score?.fullTime?.away ?? m.score?.regularTime?.away ?? null;
      const state: LiveState = {
        status: m.status,
        scoreA,
        scoreB,
        minute: m.minute ?? null,
        isLive: LIVE_STATUSES.includes(m.status),
      };
      out.set(key1, state);
      out.set(key2, state);
    }
    return out;
  } catch {
    return new Map();
  }
}

/**
 * Look up live state for a given match using its team codes and UK kickoff ISO.
 * Tries both (A,B) and (B,A) orderings since football-data may flip home/away.
 */
export function liveStateFor(
  live: Map<string, LiveState>,
  teamA: string,
  teamB: string,
  kickoffUk: string,
): LiveState | undefined {
  // Convert UK kickoff to UTC day
  const utcDay = new Date(kickoffUk).toISOString().slice(0, 10);
  return (
    live.get(`${teamA}|${teamB}|${utcDay}`) ??
    live.get(`${teamB}|${teamA}|${utcDay}`)
  );
}
