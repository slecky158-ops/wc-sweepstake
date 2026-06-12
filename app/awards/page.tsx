import { Header } from '@/components/Header';
import { awards } from '@/lib/data';

export const dynamic = 'force-static';

export default function AwardsPage() {
  return (
    <main className="page-enter">
      <Header eyebrow={`${awards.length} prizes · live`} title="Awards" />

      <div className="px-5 sm:px-8 pt-5 space-y-3 pb-2">
        {awards.map((a, i) => (
          <article key={a.id} className="ink-card p-4">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="num text-[11px] text-text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="display text-base sm:text-lg text-text-ink leading-tight">{a.title}</h3>
              <span className="ml-auto eyebrow">{a.type}</span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-text-ink-dim leading-relaxed pl-7 mb-2">{a.rule}</p>
            <div className="pl-7 mb-3">
              <span className="eyebrow mr-2">Prize</span>
              <span className="text-sm font-bold text-gold">{a.prize}</span>
            </div>

            <div className="pl-7 grid grid-cols-2 gap-3 pt-3 border-t border-ink-line">
              <div>
                <div className="eyebrow mb-1">Current leader</div>
                <div className="text-sm font-bold text-text-ink">
                  {a.currentLeader || <span className="text-text-ink-faint font-normal">— TBD —</span>}
                </div>
              </div>
              <div>
                <div className="eyebrow mb-1">Winner</div>
                <div className="text-sm font-bold text-text-ink">
                  {a.winnerEntrant || <span className="text-text-ink-faint font-normal">— TBD —</span>}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="px-5 sm:px-8 mt-5 mb-2 text-[11px] text-text-ink-faint text-center font-bold uppercase tracking-widest">
        Updates as match data comes in
      </p>
    </main>
  );
}
