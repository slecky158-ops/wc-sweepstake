import Link from 'next/link';
import { DailyMatch } from '@/lib/types';
import type { LiveState } from '@/lib/live';
import { getTeam, getEntrantForTeam } from '@/lib/data';

function hostClass(country: string | undefined) {
  if (country === 'MX') return 'host-mex';
  if (country === 'US') return 'host-usa';
  if (country === 'CA') return 'host-can';
  return '';
}

export function DailyMatchCard({ match, kind, live }: { match: DailyMatch; kind: 'yesterday' | 'today'; live?: LiveState }) {
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);
  const eA = getEntrantForTeam(match.teamA);
  const eB = getEntrantForTeam(match.teamB);
  const host = hostClass(match.venue?.country);

  return (
    <article className={`paper ${host} relative overflow-hidden`}>
      {/* Host country band — the FIFA signature device */}
      <div
        className="h-1 w-full"
        style={{ background: 'rgb(var(--host, var(--gold)))' }}
      />

      {/* Strip: group / rank / kickoff */}
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 flex items-center flex-wrap gap-x-2 gap-y-1.5 border-b border-paper-line">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.stage === 'group' ? (
            <span className="font-black text-[11px] sm:text-xs tracking-widest whitespace-nowrap">GRP {match.group}</span>
          ) : (
            <span className="font-black text-[11px] sm:text-xs tracking-widest whitespace-nowrap">{match.round}</span>
          )}
          {match.rank != null && (
            <span
              className="text-[10px] font-black tracking-wider px-1.5 py-0.5 whitespace-nowrap"
              style={{ background: 'rgb(var(--host, var(--gold)))', color: 'rgb(var(--paper))' }}
            >
              #{match.rank}/72
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 ml-auto whitespace-nowrap">
          <span className="num text-sm sm:text-base text-text-paper">{match.timeUk.replace(' UK', '')}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-paper-faint">UK</span>
          <span className="text-text-paper-faint mx-0.5">/</span>
          <span className="num text-[13px] sm:text-sm text-text-paper-dim">{match.timeEt.replace(' ET', '')}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-paper-faint">ET</span>
        </div>
      </div>

      {/* Venue + broadcast */}
      <div className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-text-paper-dim border-b border-paper-line/60 min-w-0 overflow-hidden">
        <span className="font-bold text-text-paper truncate min-w-0">{match.venue.stadium}</span>
        <span className="text-text-paper-faint shrink-0">·</span>
        <span className="truncate min-w-0">{match.venue.city}</span>
        <span className="ml-auto font-semibold whitespace-nowrap text-[10px] sm:text-[11px]">
          {match.broadcast.uk} <span className="text-text-paper-faint">·</span> {match.broadcast.us}
        </span>
      </div>

      {/* Teams — explicit % widths so columns never grow beyond their share. */}
      <div className="px-3 sm:px-5 py-5 sm:py-6 flex items-center gap-0">
        <div style={{ width: '42%', overflow: 'hidden' }} className="flex flex-col items-center text-center gap-2">
          {a && (
            <Link href={`/matches?country=${a.code}`} className="flex flex-col items-center gap-2 w-full overflow-hidden group">
              <span className="text-3xl sm:text-4xl leading-none" aria-hidden="true">{a.flag}</span>
              <div className="display text-[14px] sm:text-xl text-text-paper truncate w-full leading-tight group-hover:text-gold-deep transition-colors">{a.name}</div>
            </Link>
          )}
          {eA && (
            <Link
              href={`/entrants/${eA.slug}`}
              className="block text-[10px] font-bold uppercase tracking-widest text-text-paper-dim hover:text-text-paper truncate w-full"
            >
              {eA.name}
            </Link>
          )}
        </div>

        <div style={{ width: '16%' }} className="text-center shrink-0">
          {live?.isLive && typeof live.scoreA === 'number' && typeof live.scoreB === 'number' ? (
            <>
              <div className="display text-2xl sm:text-4xl text-signal whitespace-nowrap leading-none">
                {live.scoreA}<span className="text-text-paper-faint mx-1">–</span>{live.scoreB}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-signal text-white text-[9px] font-black uppercase tracking-widest rounded">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                {live.status === 'PAUSED' ? 'HT' : live.status === 'EXTRA_TIME' ? 'ET' : live.status === 'PENALTY_SHOOTOUT' ? 'PEN' : (live.minute != null ? `${live.minute}'` : 'LIVE')}
              </div>
            </>
          ) : kind === 'yesterday' && typeof match.scoreA === 'number' && typeof match.scoreB === 'number' ? (
            <div className="display text-2xl sm:text-4xl text-done whitespace-nowrap leading-none">
              {match.scoreA}<span className="text-text-paper-faint mx-1">–</span>{match.scoreB}
            </div>
          ) : (
            <div className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-text-paper-faint">VS</div>
          )}
        </div>

        <div style={{ width: '42%', overflow: 'hidden' }} className="flex flex-col items-center text-center gap-2">
          {b && (
            <Link href={`/matches?country=${b.code}`} className="flex flex-col items-center gap-2 w-full overflow-hidden group">
              <span className="text-3xl sm:text-4xl leading-none" aria-hidden="true">{b.flag}</span>
              <div className="display text-[14px] sm:text-xl text-text-paper truncate w-full leading-tight group-hover:text-gold-deep transition-colors">{b.name}</div>
            </Link>
          )}
          {eB && (
            <Link
              href={`/entrants/${eB.slug}`}
              className="block text-[10px] font-bold uppercase tracking-widest text-text-paper-dim hover:text-text-paper truncate w-full"
            >
              {eB.name}
            </Link>
          )}
        </div>
      </div>

      {/* TODAY ONLY: preview block — clean horizontal rows, no chips */}
      {kind === 'today' && (match.weather || match.h2h || match.odds) && (
        <div className="border-t border-paper-line bg-paper-soft/40">
          {match.weather && (
            <div className="px-5 py-2 grid grid-cols-[80px_1fr] items-center gap-3 border-b border-paper-line/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint">Weather</span>
              <span className="text-[12px] text-text-paper font-medium">{match.weather}</span>
            </div>
          )}
          {match.h2h && (
            <div className="px-5 py-2 grid grid-cols-[80px_1fr] items-center gap-3 border-b border-paper-line/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint">H2H</span>
              <span className="text-[12px] text-text-paper font-medium">{match.h2h}</span>
            </div>
          )}
          {match.odds && (
            <div className="px-5 py-2 grid grid-cols-[80px_1fr] items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint">Odds</span>
              <span className="text-[12px] text-text-paper font-medium flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="num">{match.odds.match.home}</span>
                <span className="text-text-paper-faint">/</span>
                <span className="num">{match.odds.match.draw}</span>
                <span className="text-text-paper-faint">/</span>
                <span className="num">{match.odds.match.away}</span>
                <span className="text-text-paper-faint mx-1">·</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint">{match.odds.extra.label}</span>
                <span className="num">{match.odds.extra.value}</span>
                <span className="text-text-paper-faint mx-1">·</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint">FGS</span>
                <span>{match.odds.fgs.name}</span>
                <span className="num">{match.odds.fgs.odds}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* TODAY: facts */}
      {kind === 'today' && match.facts && (
        <div className="px-5 py-4 border-t border-paper-line grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint mb-1">{a?.name}</div>
            <div className="text-[12px] text-text-paper leading-relaxed">{match.facts.home}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint mb-1">{b?.name}</div>
            <div className="text-[12px] text-text-paper leading-relaxed">{match.facts.away}</div>
          </div>
        </div>
      )}

      {/* YESTERDAY: scorers + analysis */}
      {kind === 'yesterday' && (match.scorers || match.analysis) && (
        <div className="px-5 py-4 border-t border-paper-line space-y-3">
          {match.scorers && (
            <div className="text-[12px] text-text-paper">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-paper-faint mr-2">Goals</span>
              {match.scorers}
              {match.note && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-can">{match.note}</span>
              )}
            </div>
          )}
          {match.analysis && (
            <div className="border-l-2 border-done pl-3">
              {match.analysis.lines.map((line, i) => (
                <div key={i} className="text-[12px] text-text-paper leading-snug mb-1 last:mb-0">{line}</div>
              ))}
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-paper-faint mt-1.5">{match.analysis.source}</div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
