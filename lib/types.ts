export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
export type KnockoutRound = 'R32' | 'R16' | 'QF' | 'SF' | '3rd' | 'F';

export interface Team {
  code: string;       // e.g. 'MEX'
  name: string;       // e.g. 'Mexico'
  flag: string;       // emoji
  group: Group;
}

export interface Entrant {
  name: string;       // e.g. 'Sam L'
  slug: string;       // e.g. 'sam-l'
  teamA: string;      // team code
  teamB: string;      // team code
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
  scorers?: Array<{ name: string; team: 'A' | 'B'; minute: number; isOG?: boolean; isPen?: boolean }>;
  notes?: string[];   // e.g. 'Red card · Otamendi 78'', 'Concluded after 08:00 UK'
  finishedExtraTime?: boolean;
  finishedPens?: boolean;
}

export interface Venue {
  stadium: string;
  city: string;
  country: 'US' | 'CA' | 'MX';
}

export interface Broadcast {
  uk: string;
  us: string;
}

export interface Quality {
  elo: number;
  balance: number;
  total: number;
}

export interface Match {
  id: string;
  stage: 'group' | 'knockout';
  group: Group | null;
  round: KnockoutRound | null;
  matchNo?: number;
  rank: number | null;     // 1-72 for group-stage; null for knockouts
  kickoffUk: string | null; // ISO with offset, e.g. '2026-06-11T20:00:00+01:00'
  teamA: string | null;
  teamB: string | null;
  venue: Venue | null;
  broadcast: Broadcast | null;
  status: 'scheduled' | 'live' | 'completed' | 'tbd';
  result: MatchResult | null;
  quality?: Quality;
}

export type AwardKind = 'team' | 'player' | 'modifier';

export interface Award {
  id: string;
  title: string;
  type: AwardKind;
  rule: string;
  icon: string;
  currentLeader: string | null;   // free-text for now (team/player name)
  winnerEntrant: string | null;   // entrant slug if known
}

// ──────────── Daily payload (sidecar JSON written by the daily routine) ────────────

export interface Storyline {
  headline: string;
  subtitle: string;
}

export interface DailyResultLine {
  text: string;
  source?: string;
}

export interface DailyMatch {
  matchId: string;
  rank: number | null;
  group: Group | null;
  stage: 'group' | 'knockout';
  round: KnockoutRound | null;
  kickoffUk: string;       // ISO with offset
  timeUk: string;          // 'HH:MM UK'
  timeEt: string;          // 'HH:MM ET'
  venue: Venue;
  broadcast: Broadcast;
  teamA: string;
  teamB: string;
  weather: string | null;
  h2h: string | null;
  odds: {
    match: { home: string; draw: string; away: string };
    extra: { label: string; value: string };
    fgs: { name: string; odds: string };
  } | null;
  facts?: { home: string; away: string };
  // Result fields (yesterday matches only)
  score?: string;          // e.g. "2-0"
  scoreA?: number;
  scoreB?: number;
  scorers?: string;
  note?: string;
  analysis?: { lines: string[]; source: string };
}

export interface DailyNews {
  kicker: string;
  headline: string;
  body: string;
  source: string;
}

export interface DailyPayload {
  generatedAt: string;
  dateLong: string;
  dateDay: string;
  dateRest: string;
  yesterdayCount: string;
  todayCount: string;
  yesterdayStoryline: Storyline | null;
  todayStoryline: Storyline | null;
  yesterday: DailyMatch[];
  today: DailyMatch[];
  news: DailyNews;
  footerNote?: string;
}

export interface Rules {
  title: string;
  entryFee: number;
  currency: string;
  entrants: number;
  potTotal: number;
  draw: string;
  awards: string[];
  tiebreaker: { headline: string; detail: string };
  iranMultiplier: string;
  notes: string[];
}
