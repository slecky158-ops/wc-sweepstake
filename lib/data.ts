import teamsJson from '@/data/teams.json';
import entrantsJson from '@/data/entrants.json';
import matchesJson from '@/data/matches.json';
import awardsJson from '@/data/awards.json';
import rulesJson from '@/data/rules.json';
import dailyJson from '@/data/daily-current.json';
import type { Team, Entrant, Match, Award, Rules, DailyPayload } from './types';

export const teams: Team[] = teamsJson as Team[];
export const entrants: Entrant[] = entrantsJson as Entrant[];
export const matches: Match[] = matchesJson as Match[];
export const awards: Award[] = awardsJson as Award[];
export const rules: Rules = rulesJson as Rules;
export const daily: DailyPayload = dailyJson as unknown as DailyPayload;

// ────────────────── Lookups ──────────────────

const teamByCode = new Map(teams.map(t => [t.code, t]));
const entrantBySlug = new Map(entrants.map(e => [e.slug, e]));
const entrantByTeamCode = new Map<string, Entrant>();
for (const e of entrants) {
  entrantByTeamCode.set(e.teamA, e);
  entrantByTeamCode.set(e.teamB, e);
}

export function getTeam(code: string | null | undefined): Team | undefined {
  if (!code) return undefined;
  return teamByCode.get(code);
}
export function getEntrant(slug: string): Entrant | undefined {
  return entrantBySlug.get(slug);
}
export function getEntrantForTeam(code: string | null | undefined): Entrant | undefined {
  if (!code) return undefined;
  return entrantByTeamCode.get(code);
}

// ────────────────── Queries ──────────────────

export function matchesForTeam(code: string): Match[] {
  return matches.filter(m => m.teamA === code || m.teamB === code);
}

export function matchesForEntrant(slug: string): Match[] {
  const e = entrantBySlug.get(slug);
  if (!e) return [];
  const codes = new Set([e.teamA, e.teamB]);
  return matches.filter(m => (m.teamA && codes.has(m.teamA)) || (m.teamB && codes.has(m.teamB)));
}

export function todaysFixturesUK(now: Date = new Date()): Match[] {
  // "Today" window = 08:00 UK today → 08:00 UK tomorrow (exclusive).
  const todayStart = startOfWindowUK(now);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 3600 * 1000);
  return matches.filter(m => {
    if (!m.kickoffUk) return false;
    const t = new Date(m.kickoffUk).getTime();
    return t >= todayStart.getTime() && t < tomorrowStart.getTime();
  }).sort((a, b) => (a.kickoffUk! < b.kickoffUk! ? -1 : 1));
}

export function yesterdaysResultsUK(now: Date = new Date()): Match[] {
  const todayStart = startOfWindowUK(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
  return matches.filter(m => {
    if (!m.kickoffUk) return false;
    const t = new Date(m.kickoffUk).getTime();
    return t >= yesterdayStart.getTime() && t < todayStart.getTime();
  }).sort((a, b) => (a.kickoffUk! < b.kickoffUk! ? -1 : 1));
}

// 08:00 UK today, expressed as a real Date (UTC under the hood).
// During BST (Mar→Oct), UK = UTC+1; otherwise UTC.
function startOfWindowUK(now: Date): Date {
  const ukParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => ukParts.find(p => p.type === t)?.value || '00';
  const y = get('year'), m = get('month'), d = get('day');
  // Construct 08:00 in Europe/London. We don't have a clean stdlib way to do
  // this without a tz library, so approximate with the BST offset for WC dates.
  // For dates Jun–Jul 2026 the UK offset is +01:00 (BST).
  return new Date(`${y}-${m}-${d}T08:00:00+01:00`);
}

// ────────────────── Formatting helpers ──────────────────

export function formatTimeUK(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

export function formatTimeET(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

export function formatDateUK(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(iso));
}

export function formatDateLongUK(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}
