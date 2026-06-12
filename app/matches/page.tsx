import { Header } from '@/components/Header';
import { MatchesList } from './list';
import { matches, teams, entrants } from '@/lib/data';
import { getLiveScores, liveStateFor } from '@/lib/live';
import type { LiveState } from '@/lib/live';

export const dynamic = 'force-dynamic';

export default async function MatchesPage({ searchParams }: { searchParams: { country?: string; entrant?: string; group?: string } }) {
  // Build matchId → LiveState lookup for every match with a kickoff time.
  const live = await getLiveScores();
  const liveByMatchId: Record<string, LiveState> = {};
  for (const m of matches) {
    if (!m.teamA || !m.teamB || !m.kickoffUk) continue;
    const state = liveStateFor(live, m.teamA, m.teamB, m.kickoffUk);
    if (state) liveByMatchId[m.id] = state;
  }

  return (
    <main className="page-enter">
      <Header eyebrow="All fixtures" title="Matches" />
      <div className="px-5 sm:px-8 pt-5">
        <div className="eyebrow mb-4">{matches.length} fixtures · Group stage + Knockouts</div>
        <MatchesList
          matches={matches}
          teams={teams}
          entrants={entrants}
          liveByMatchId={liveByMatchId}
          initialCountry={searchParams.country || ''}
          initialEntrant={searchParams.entrant || ''}
          initialGroup={searchParams.group || ''}
        />
      </div>
    </main>
  );
}
