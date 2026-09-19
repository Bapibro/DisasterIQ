import { ArrowRight, Gauge, Sparkles } from 'lucide-react';
import type { QuizCategory } from '../data/quizzes';
import { DepthCard } from './DepthCard';

export function DepthQuizCard({ category, onStart }: { category: QuizCategory; onStart: () => void }) {
  const Icon = category.icon;

  return (
    <DepthCard className="h-full min-h-[260px] p-5 md:p-6" intensity={14}>
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
            <Icon size={20} />
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/70">
            {category.difficulty}
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-medium text-white">{category.name}</h3>
          <p className="text-sm leading-relaxed text-white/65">{category.description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/60">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={12} />
            {category.count} Qs
          </span>
          <span className="inline-flex items-center gap-2">
            <Gauge size={12} />
            {category.difficulty}
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-all duration-200 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Start Quiz
          <ArrowRight size={15} />
        </button>
      </div>
    </DepthCard>
  );
}
