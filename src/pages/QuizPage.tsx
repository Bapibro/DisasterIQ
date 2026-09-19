import { useMemo, useState } from 'react';
import { BrainCircuit, Flame, ShieldCheck } from 'lucide-react';
import { DepthQuizCard } from '../components/DepthQuizCard';
import { QuizProgress } from '../components/QuizProgress';
import { QuizQuestion } from '../components/QuizQuestion';
import { QuizResult } from '../components/QuizResult';
import { getCategoryById, quizCategories, quizQuestions } from '../data/quizzes';

export function QuizPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [isComplete, setIsComplete] = useState(false);

  const activeCategory = useMemo(
    () => (selectedCategoryId ? getCategoryById(selectedCategoryId) : null),
    [selectedCategoryId],
  );

  const activeQuestions = useMemo(() => {
    if (!selectedCategoryId) return [];
    return quizQuestions.filter((question) => question.category === selectedCategoryId);
  }, [selectedCategoryId]);

  const currentQuestion = activeQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentIndex] ?? null : null;
  const score = useMemo<number>(
    () =>
      answers.reduce<number>((total, answer, index) => {
        const question = activeQuestions[index];
        if (question && answer === question.correctAnswer) {
          return total + 1;
        }
        return total;
      }, 0),
    [activeQuestions, answers],
  );

  const startQuiz = (categoryId: string) => {
    const categoryQuestions = quizQuestions.filter((question) => question.category === categoryId);

    setSelectedCategoryId(categoryId);
    setCurrentIndex(0);
    setAnswers(new Array(categoryQuestions.length).fill(null));
    setIsComplete(false);
  };

  const resetQuiz = () => {
    if (!selectedCategoryId) return;
    startQuiz(selectedCategoryId);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion || currentAnswer !== null || isComplete) return;

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = optionIndex;
    setAnswers(nextAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentQuestion || currentAnswer === null) return;

    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setIsComplete(true);
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToHub = () => {
    setSelectedCategoryId(null);
    setCurrentIndex(0);
    setAnswers([]);
    setIsComplete(false);
  };

  const progressValue = activeQuestions.length ? ((currentIndex + (isComplete ? 1 : 0)) / activeQuestions.length) * 100 : 0;

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">DisasterReady AI</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            DisasterIQ Quiz Lab
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <BrainCircuit size={14} />
          Scenario training
        </div>
      </div>

      {!selectedCategoryId ? (
        <div className="space-y-8">
          <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(60,80,110,0.45),rgba(6,10,14,0.96))] p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">Emergency readiness</p>
                <h2 className="mt-4 max-w-[620px] text-3xl font-medium tracking-[-0.04em] text-white md:text-5xl">
                  Test your instincts before real conditions change.
                </h2>
                <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/70">
                  Explore resilience training by hazard type, then answer realistic campus and community scenarios designed to build calm and confident decision-making.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  <ShieldCheck size={15} />
                  Quick readiness snapshot
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Topics</div>
                    <div className="mt-2 text-3xl font-medium text-white">{quizCategories.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Scenarios</div>
                    <div className="mt-2 text-3xl font-medium text-white">{quizQuestions.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {quizCategories.map((category) => (
              <DepthQuizCard key={category.id} category={category} onStart={() => startQuiz(category.id)} />
            ))}
          </div>
        </div>
      ) : !isComplete ? (
        <div className="space-y-6">
          {activeCategory && (
            <div className="flex flex-col gap-4 rounded-[26px] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Quiz category</p>
                <h2 className="mt-2 text-2xl font-medium text-white md:text-3xl">{activeCategory.name}</h2>
              </div>

              <button
                type="button"
                onClick={goToHub}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/75"
              >
                <Flame size={14} />
                Quiz Hub
              </button>
            </div>
          )}

          <QuizProgress value={progressValue} current={currentIndex} total={activeQuestions.length} />

          {currentQuestion && (
            <QuizQuestion
              question={currentQuestion}
              questionNumber={currentIndex}
              total={activeQuestions.length}
              onSelect={handleSelectOption}
              onNext={handleNextQuestion}
              onPrevious={handlePreviousQuestion}
              selectedOption={currentAnswer}
              isAnswered={currentAnswer !== null}
              canGoBack={currentIndex > 0}
            />
          )}
        </div>
      ) : (
        <QuizResult
          score={score}
          total={activeQuestions.length}
          onRetry={resetQuiz}
          onHub={goToHub}
        />
      )}
    </section>
  );
}
