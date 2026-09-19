import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { QuizQuestion } from '../data/quizzes';

export function QuizQuestion({
  question,
  questionNumber,
  total,
  onSelect,
  onNext,
  onPrevious,
  selectedOption,
  isAnswered,
  canGoBack,
}: {
  question: QuizQuestion;
  questionNumber: number;
  total: number;
  onSelect: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  selectedOption: number | null;
  isAnswered: boolean;
  canGoBack: boolean;
}) {
  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0a1217]/80 p-5 text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
        <span>
          {question.difficulty}
        </span>
        <span>
          {questionNumber + 1}/{total}
        </span>
      </div>

      <h3 className="text-[22px] font-medium leading-relaxed text-white md:text-[28px]">{question.question}</h3>

      <div className="mt-6 space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrectChoice = index === question.correctAnswer;
          const showCorrectState = isAnswered && isCorrectChoice;
          const showIncorrectState = isAnswered && isSelected && !isCorrectChoice;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Answer option ${index + 1}: ${option}`}
              onClick={() => onSelect(index)}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                showCorrectState
                  ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                  : showIncorrectState
                    ? 'border-red-400/80 bg-red-500/10 text-red-100'
                    : isSelected
                      ? 'border-white/30 bg-white/8 text-white'
                      : 'border-white/10 bg-white/2 text-white/80 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <span>{option}</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current/30">
                {showCorrectState ? <Check size={12} /> : showIncorrectState ? <X size={12} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${isCorrect ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-red-400/40 bg-red-500/10 text-red-100'}`}>
          <strong>{isCorrect ? 'Correct.' : 'Not quite.'}</strong> {question.explanation}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/70 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isAnswered}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {questionNumber === total - 1 ? 'See Results' : 'Next Question'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
