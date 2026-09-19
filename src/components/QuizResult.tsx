import { ArrowRight, Trophy } from 'lucide-react';

export function QuizResult({
  score,
  total,
  onRetry,
  onHub,
}: {
  score: number;
  total: number;
  onRetry: () => void;
  onHub: () => void;
}) {
  const percentage = Math.round((score / total) * 100);
  const message =
    percentage >= 80
      ? 'Excellent. Your response instincts are strong.'
      : percentage >= 60
        ? 'Strong work. A little more practice will sharpen your judgment.'
        : percentage >= 40
          ? 'Good start. Review the explanations and test again.'
          : 'Keep practicing. Every scenario is a chance to improve.';

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0d1419]/85 p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] md:p-8">
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
        <Trophy size={16} />
        Quiz complete
      </div>

      <div className="mt-6 text-[54px] font-[Inter] leading-none tracking-[-0.05em] text-white">{percentage}%</div>
      <p className="mt-3 text-sm text-white/70">{message}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Score</div>
          <div className="mt-2 text-2xl font-medium text-white">{score}/{total}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Correct</div>
          <div className="mt-2 text-2xl font-medium text-white">{score}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Incorrect</div>
          <div className="mt-2 text-2xl font-medium text-white">{total - score}</div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-black"
        >
          Retry Quiz
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={onHub}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white"
        >
          Back to Quiz Hub
        </button>
      </div>
    </div>
  );
}
