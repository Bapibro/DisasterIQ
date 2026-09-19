export function ProgressBar({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
        <span>Preparedness</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="progress-fill h-full rounded-full bg-white" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
