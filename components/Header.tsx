import Link from 'next/link';

export function Header({ title, eyebrow, back, action }: { title: string; eyebrow?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 bg-bg/95 backdrop-blur-md z-10 border-b border-paper-line">
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {back && (
            <Link href={back} className="text-text-faint hover:text-text text-xs uppercase tracking-widest font-bold mb-1.5 inline-block">
              ← Back
            </Link>
          )}
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h1 className="text-2xl font-black tracking-tight leading-none text-text">{title}</h1>
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>
    </header>
  );
}
