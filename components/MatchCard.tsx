import Link from 'next/link';
import { Match } from '@/lib/types';
import type { LiveState } from '@/lib/live';
import { getTeam, getEntrantForTeam, formatTimeUK, formatTimeET, formatDateUK } from '@/lib/data';

function hostClass(country: string | undefined) {
  if (country === 'MX') return 'host-mex';
  if (country === 'US') return 'host-usa';
  if (country === 'CA') return 'host-can';
  return '';
}

export function MatchCard({ match, live }: { match: Match; live?: LiveState }) {
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const eA = getEntrantForTeam(match.teamA);
  const eB = getEntrantForTeam(match.teamB);
  const completed = match.status === 'completed' && !!match.result;
  const isKO = match.stage === 'knockout';
  const host = hostClass(match.venue?.country);

  return (
    <article className={`paper ${host} relative overflow-hidden`}>
      <div className="h-1 w-full" style={{ background: 'rgb(var(--host, var(--gold)))' }} />

      {/* Strip */}
      <div className="px-3 sm:px-4 pt-2.5 pb-2 flex items-center flex-wrap gap-x-2 gap-y-1 border-b border-paper-line">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-black text-[11px] tracking-widest whitespace-nowrap">
            {isKO ? match.round : `GRP ${match.group}`}
          </span>
          {match.rank != null && (
            <span
              className="text-[10px] font-black tracking-wider px-1.5 py-0.5 whitespace-nowrap"
              style={{ background: 'rgb(var(--host, var(--gold)))', color: 'rgb(var(--paper))' }}
            >
              #{match.rank}/72
            </span>
          )}
        </div>
        <div className="ml-auto flex items-baseline gap-1 whitespace-nowrap">
          {match.kickoffUk ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-paper-faint">{formatDateUK(match.kickoffUk)}</span>
              <span className="num text-[13px] text-text-paper">{formatTimeUK(match.kickoffUk)}</span>
            </>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-paper-faint">TBD</span>
          )}
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="px-3 sm:px-4 py-1.5 text-[11px] text-text-paper-dim border-b border-paper-line/60 flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className="font-bold text-text-paper truncate min-w-0">{match.venue.stadium}</span>
          <span className="text-text-paper-faint shrink-0">·</span>
          <span className="truncate min-w-0">{match.venue.city}</span>
        </div>
      )}

      {/* Teams — explicit % widths so columns never expand beyond their share. */}
      <div className="px-3 sm:px-4 py-4 sm:py-5 flex items-center gap-2 sm:gap-3">
        <div style={{ width: '40%', overflow: 'hidden' }} className="flex flex-col items-center text-center gap-1.5 px-2">
          {a ? (
            <Link href={`/matches?country=${a.code}`} className="flex flex-col items-center gap-1.5 w-full overflow-hidden group">
              <span className="text-2xl sm:text-3xl leading-none" aria-hidden="true">{a.flag}</span>
              <div className="display text-[13px] sm:text-base text-text-paper truncate w-full leading-tight group-hover:text-gold-deep transition-colors">{a.name}</div>
            </Link>
          ) : <span className="text-text-paper-faint text-sm">TBD</span>}
          {eA && (
            <Link href={`/entrants/${eA.slug}`} className="block text-[10px] font-bold uppercase tracking-widest text-text-paper-dim hover:text-text-paper truncate w-full">
              {eA.name}
            </Link>
          )}
        </div>

        <div style={{ width: '20%' }} className="text-center">
          {live?.isLive && typeof live.scoreA === 'number' && typeof live.scoreB === 'number' ? (
            <>
              <div className="display text-xl sm:text-3xl text-signal whitespace-nowrap leading-none">
                {live.scoreA}<span className="text-text-paper-faint mx-1">–</span>{live.scoreB}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-signal text-white text-[9px] font-black uppercase tracking-widest rounded">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                {live.status === 'PAUSED' ? 'HT' : live.status === 'EXTRA_TIME' ? 'ET' : live.status === 'PENALTY_SHOOTOUT' ? 'PEN' : (live.minute != null ? `${live.minute}'` : 'LIVE')}
              </div>
            </>
          ) : completed && match.result ? (
            <div className="display text-xl sm:text-3xl text-done whitespace-nowrap">
              {match.result.scoreA}<span className="text-text-paper-faint mx-1">–</span>{match.result.scoreB}
            </div>
          ) : (
            <div className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-text-paper-faint">VS</div>
          )}
        </div>

        <div style={{ width: '40%', overflow: 'hidden' }} className="flex flex-col items-center text-center gap-1.5 px-2">
          {b ? (
            <Link href={`/matches?country=${b.code}`} className="flex flex-col items-center gap-1.5 w-full overflow-hidden group">
              <span className="text-2xl sm:text-3xl leading-none" aria-hidden="true">{b.flag}</span>
              <div className="display text-[13px] sm:text-base text-text-paper truncate w-full leading-tight group-hover:text-gold-deep transition-colors">{b.name}</div>
            </Link>
          ) : <span className="text-text-paper-faint text-sm">TBD</span>}
          {eB && (
            <Link href={`/entrants/${eB.slug}`} className="block text-[10px] font-bold uppercase tracking-widest text-text-paper-dim hover:text-text-paper truncate w-full">
              {eB.name}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
