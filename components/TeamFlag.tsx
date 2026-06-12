import { getTeam } from '@/lib/data';

export function TeamFlag({ code, size = 'md', showName = true }: { code: string | null | undefined; size?: 'sm' | 'md' | 'lg'; showName?: boolean }) {
  const team = getTeam(code);
  if (!team) return <span className="text-muted">—</span>;
  const flagSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const nameSize = size === 'lg' ? 'text-base font-bold' : size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-semibold';
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className={`${flagSize} leading-none shrink-0`} aria-hidden="true">{team.flag}</span>
      {showName && <span className={`${nameSize} truncate`}>{team.name}</span>}
    </span>
  );
}
