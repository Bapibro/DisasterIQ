export function QuizProgress({ value, current, total }: { value: number; current: number; total: number }) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
        <span>
          Question {current + 1}/{total}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.9),rgba(180,205,255,0.85))] transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
