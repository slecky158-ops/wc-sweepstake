'use client';

import { useMemo, useState } from 'react';
import { Match, Team, Entrant } from '@/lib/types';
import type { LiveState } from '@/lib/live';
import { MatchCard } from '@/components/MatchCard';

type StatusFilter = 'all' | 'upcoming' | 'completed';
type StageFilter = 'all' | 'group' | 'knockout';

export function MatchesList({
  matches, teams, entrants, liveByMatchId,
  initialCountry = '', initialEntrant = '', initialGroup = '',
}: {
  matches: Match[]; teams: Team[]; entrants: Entrant[];
  liveByMatchId?: Record<string, LiveState>;
  initialCountry?: string; initialEntrant?: string; initialGroup?: string;
}) {
  const [entrantSlug, setEntrantSlug] = useState<string>(initialEntrant);
  const [teamCode, setTeamCode] = useState<string>(initialCountry);
  const [group, setGroup] = useState<string>(initialGroup);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [stage, setStage] = useState<StageFilter>('all');

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (stage !== 'all' && m.stage !== stage) return false;
      if (group && m.group !== group) return false;
      if (teamCode && m.teamA !== teamCode && m.teamB !== teamCode) return false;
      if (entrantSlug) {
        const en = entrants.find(e => e.slug === entrantSlug);
        if (!en) return false;
        const teams = new Set([en.teamA, en.teamB]);
        if (!(teams.has(m.teamA ?? '') || teams.has(m.teamB ?? ''))) return false;
      }
      if (status === 'upcoming' && m.status === 'completed') return false;
      if (status === 'completed' && m.status !== 'completed') return false;
      return true;
    });
  }, [matches, entrants, stage, group, teamCode, entrantSlug, status]);

  const groupsList = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const teamsSorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const entrantsSorted = [...entrants].sort((a, b) => a.name.localeCompare(b.name));

  const reset = () => {
    setEntrantSlug(''); setTeamCode(''); setGroup(''); setStatus('all'); setStage('all');
  };
  const anyActive = !!(entrantSlug || teamCode || group || status !== 'all' || stage !== 'all');

  return (
    <div className="space-y-5">

      {/* Filters */}
      <div className="surface p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 min-w-0">
          <label className="block min-w-0">
            <div className="eyebrow mb-1.5">By entrant</div>
            <select className="field min-w-0 max-w-full" value={entrantSlug} onChange={e => setEntrantSlug(e.target.value)}>
              <option value="">Anyone</option>
              {entrantsSorted.map(e => (<option key={e.slug} value={e.slug}>{e.name}</option>))}
            </select>
          </label>
          <label className="block min-w-0">
            <div className="eyebrow mb-1.5">By country</div>
            <select className="field min-w-0 max-w-full" value={teamCode} onChange={e => setTeamCode(e.target.value)}>
              <option value="">Any team</option>
              {teamsSorted.map(t => (<option key={t.code} value={t.code}>{t.flag} {t.name}</option>))}
            </select>
          </label>
        </div>

        <div className="min-w-0">
          <div className="eyebrow mb-2">Group</div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setGroup('')} className={`filter-chip ${group === '' ? 'filter-chip-active' : ''}`}>All</button>
            {groupsList.map(g => (
              <button key={g} onClick={() => setGroup(g)} className={`filter-chip ${group === g ? 'filter-chip-active' : ''}`}>{g}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="min-w-0">
            <div className="eyebrow mb-2">Stage</div>
            <div className="flex flex-wrap gap-1.5">
              {(['all','group','knockout'] as const).map(s => (
                <button key={s} onClick={() => setStage(s)} className={`filter-chip ${stage === s ? 'filter-chip-active' : ''}`}>
                  {s === 'all' ? 'All' : s === 'group' ? 'Group' : 'KO'}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="eyebrow mb-2">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {(['all','upcoming','completed'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)} className={`filter-chip ${status === s ? 'filter-chip-active' : ''}`}>
                  {s === 'all' ? 'All' : s === 'upcoming' ? 'Upcoming' : 'Played'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {anyActive && (
          <button onClick={reset} className="filter-chip text-can border-can/40 hover:bg-can/10">
            Clear all filters
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="eyebrow">Showing <span className="text-text num">{filtered.length}</span> of {matches.length}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="paper p-6 text-center text-text-paper-dim text-sm">No matches match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(m => <MatchCard key={m.id} match={m} live={liveByMatchId?.[m.id]} />)}
        </div>
      )}
    </div>
  );
}
