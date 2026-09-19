import { ArrowDownUp, SlidersHorizontal } from 'lucide-react';
import type { DisasterType } from '../data/globalDisasters';

export type ArchiveSort = 'chronological' | 'fatalities' | 'recent' | 'alphabetical';

export function DisasterFilters({
  activeType,
  sort,
  onTypeChange,
  onSortChange,
}: {
  activeType: DisasterType | 'All';
  sort: ArchiveSort;
  onTypeChange: (type: DisasterType | 'All') => void;
  onSortChange: (sort: ArchiveSort) => void;
}) {
  const types: Array<DisasterType | 'All'> = ['All', 'Earthquake', 'Flood', 'Cyclone', 'Wildfire', 'Volcanic Eruption', 'Tsunami', 'Landslide', 'Tornado', 'Drought', 'Industrial'];

  return (
    <div className="sticky top-24 z-30 mx-auto flex max-w-[1440px] flex-col gap-3 rounded-[22px] border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <SlidersHorizontal className="ml-1 shrink-0 text-white/50" size={15} />
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${activeType === type ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
          >
            {type === 'Volcanic Eruption' ? 'Volcano' : type}
          </button>
        ))}
      </div>

      <label className="flex shrink-0 items-center gap-2 border-t border-white/10 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/50 md:border-l md:border-t-0 md:pl-3 md:pt-0">
        <ArrowDownUp size={13} />
        <span className="sr-only">Sort archive</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ArchiveSort)}
          className="cursor-pointer bg-transparent text-white/80 outline-none"
        >
          <option className="bg-[#10171d]" value="chronological">Chronological</option>
          <option className="bg-[#10171d]" value="fatalities">Most fatal</option>
          <option className="bg-[#10171d]" value="recent">Recent</option>
          <option className="bg-[#10171d]" value="alphabetical">Alphabetical</option>
        </select>
      </label>
    </div>
  );
}
