import { Header } from '@/components/Header';
import { MatchesList } from './list';
import { matches, teams, entrants } from '@/lib/data';

export const dynamic = 'force-static';

export default function MatchesPage() {
  return (
    <main className="page-enter">
      <Header eyebrow="All fixtures" title="Matches" />
      <div className="px-5 sm:px-8 pt-5">
        <div className="eyebrow mb-4">{matches.length} fixtures · Group stage + Knockouts</div>
        <MatchesList matches={matches} teams={teams} entrants={entrants} />
      </div>
    </main>
  );
}
