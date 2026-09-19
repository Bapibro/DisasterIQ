import { useMemo } from 'react';
import type { GlobalDisaster } from '../data/globalDisasters';

export function DisasterTimeline({ events, activeId, onSelect }: { events: GlobalDisaster[]; activeId?: string; onSelect: (id: string) => void }) {
  const years = useMemo(() => {
    const start = Math.floor(Math.min(...events.map((event) => event.year)) / 20) * 20;
    const end = Math.ceil(Math.max(...events.map((event) => event.year)) / 20) * 20;
    return Array.from({ length: Math.min(8, Math.floor((end - start) / 20) + 1) }, (_, index) => start + index * Math.ceil((end - start) / 140) * 20);
  }, [events]);

  return (
    <div className="mx-auto flex max-w-[1440px] items-center gap-3 overflow-x-auto px-5 pb-3 md:px-10">
      <div className="h-px min-w-[80px] flex-1 bg-white/20" />
      {years.map((year) => {
        const nearest = events.reduce((best, event) => (Math.abs(event.year - year) < Math.abs(best.year - year) ? event : best), events[0]);
        return (
          <button key={year} type="button" onClick={() => onSelect(nearest.id)} className={`group flex min-w-[70px] flex-col items-center gap-2 text-[10px] tracking-[0.12em] ${activeId === nearest.id ? 'text-white' : 'text-white/35 hover:text-white/80'}`}>
            <span className={`h-2 w-2 rounded-full border ${activeId === nearest.id ? 'border-white bg-white' : 'border-white/40 bg-transparent'}`} />
            <span>{year}</span>
          </button>
        );
      })}
      <div className="h-px min-w-[80px] flex-1 bg-white/20" />
    </div>
  );
}
