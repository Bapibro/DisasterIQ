import { Search, X } from 'lucide-react';

export function DisasterSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white/60 backdrop-blur-md md:max-w-[320px]">
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search the archive..."
        aria-label="Search the archive"
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear archive search" className="text-white/50 hover:text-white">
          <X size={15} />
        </button>
      )}
    </label>
  );
}
