import { Header } from '@/components/Header';
import { rules, awards } from '@/lib/data';

export const dynamic = 'force-static';

export default function RulesPage() {
  return (
    <main className="page-enter">
      <Header eyebrow="Sweepstake" title="Rules" />

      <div className="px-5 sm:px-8 pt-5 space-y-7 pb-4">

        {/* Pot summary */}
        <section className="surface p-5 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="display text-2xl text-gold">{rules.currency}{rules.entryFee}</div>
            <div className="eyebrow mt-1">Entry</div>
          </div>
          <div className="border-x border-paper-line">
            <div className="display text-2xl text-text">{rules.entrants}</div>
            <div className="eyebrow mt-1">Entrants</div>
          </div>
          <div>
            <div className="display text-2xl text-text">{rules.currency}{rules.potTotal}</div>
            <div className="eyebrow mt-1">Total pot</div>
          </div>
        </section>

        {/* Draw */}
        <section>
          <h2 className="display text-lg uppercase tracking-tight mb-2.5">The Draw</h2>
          <p className="text-sm text-text-dim leading-relaxed">{rules.draw}</p>
        </section>

        {/* Awards */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="display text-lg uppercase tracking-tight">Awards</h2>
            <span className="eyebrow">{awards.length} prizes</span>
          </div>
          <div className="space-y-2.5">
            {awards.map((a, i) => (
              <div key={a.id} className="surface p-4">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="num text-[10px] text-text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="display text-sm sm:text-base text-text leading-tight">{a.title}</h3>
                  <span className="ml-auto eyebrow">{a.type}</span>
                </div>
                <p className="text-[12px] sm:text-[13px] text-text-dim leading-relaxed pl-7 mb-2">{a.rule}</p>
                <div className="pl-7">
                  <span className="eyebrow mr-2">Prize</span>
                  <span className="text-sm font-bold text-gold">{a.prize}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tiebreaker */}
        <section className="paper border-l-4 border-gold p-5">
          <div className="eyebrow-on-paper eyebrow mb-1.5 text-gold-deep">Tiebreaker</div>
          <h3 className="display text-lg text-text-paper mb-2">{rules.tiebreaker.headline}</h3>
          <p className="text-sm text-text-paper-dim leading-relaxed">{rules.tiebreaker.detail}</p>
        </section>

        {/* Iran multiplier */}
        <section className="paper border-l-4 border-can p-5">
          <div className="eyebrow text-can-deep mb-1.5">Iran multiplier</div>
          <p className="text-sm text-text-paper leading-relaxed">{rules.iranMultiplier}</p>
        </section>

        {/* Notes */}
        <section>
          <h2 className="display text-lg uppercase tracking-tight mb-3">Notes &amp; clarifications</h2>
          <ul className="space-y-2.5">
            {rules.notes.map((n, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-dim leading-relaxed">
                <span className="num text-[10px] text-gold shrink-0 mt-1">{String(i + 1).padStart(2, '0')}</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
