import Link from 'next/link';
import { Header } from '@/components/Header';
import { awards, getEntrant } from '@/lib/data';

export const dynamic = 'force-static';

type Status = 'decided' | 'live' | 'tbd';

function statusFor(a: typeof awards[number]): Status {
  if (a.winnerEntrant) return 'decided';
  if (a.currentLeader) return 'live';
  return 'tbd';
}

function StatusPill({ status }: { status: Status }) {
  const config = {
    decided: { label: 'Decided', cls: 'bg-done/15 text-done border-done/30' },
    live:    { label: 'Live',    cls: 'bg-gold/15 text-gold-deep border-gold/30' },
    tbd:     { label: 'TBD',     cls: 'bg-text-faint/10 text-text-faint border-text-faint/20' },
  }[status];
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  );
}

function EntrantBadge({ slug, prefix }: { slug: string; prefix: string }) {
  const e = getEntrant(slug);
  if (!e) {
    return (
      <span>
        <span className="eyebrow mr-2">{prefix}</span>
        <span className="text-sm font-bold text-text">{slug}</span>
      </span>
    );
  }
  return (
    <span>
      <span className="eyebrow mr-2">{prefix}</span>
      <Link href={`/entrants/${e.slug}`} className="text-sm font-bold text-text hover:text-gold transition-colors">
        {e.name}
      </Link>
    </span>
  );
}

export default function AwardsPage() {
  return (
    <main className="page-enter">
      <Header eyebrow={`${awards.length} prizes · live`} title="Awards" />

      <div className="px-5 sm:px-8 pt-5 space-y-3 pb-2">
        {awards.map((a, i) => {
          const status = statusFor(a);
          return (
            <article key={a.id} className="surface p-4">
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span className="num text-[11px] text-text-faint shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="display text-base sm:text-lg text-text leading-tight">{a.title}</h3>
                <span className="ml-auto flex items-center gap-2 shrink-0">
                  <span className="eyebrow">{a.type}</span>
                  <StatusPill status={status} />
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-text-dim leading-relaxed pl-7 mb-2">{a.rule}</p>
              <div className="pl-7 mb-3">
                <span className="eyebrow mr-2">Prize</span>
                <span className="text-sm font-bold text-gold">{a.prize}</span>
              </div>

              <div className="pl-7 pt-3 border-t border-paper-line">
                {status === 'decided' && a.winnerEntrant ? (
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div>
                      <div className="eyebrow mb-1">Won by</div>
                      <div className="text-sm font-bold text-done">{a.currentLeader}</div>
                    </div>
                    <EntrantBadge slug={a.winnerEntrant} prefix="Goes to" />
                  </div>
                ) : status === 'live' ? (
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div>
                      <div className="eyebrow mb-1">Currently leading</div>
                      <div className="text-sm font-bold text-text">{a.currentLeader}</div>
                    </div>
                    {a.leaderEntrant && (
                      <EntrantBadge slug={a.leaderEntrant} prefix="On track for" />
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-text-faint">— Awaiting first result —</div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="px-5 sm:px-8 mt-5 mb-2 text-[11px] text-text-faint text-center font-bold uppercase tracking-widest">
        Updates as match data comes in
      </p>
    </main>
  );
}
