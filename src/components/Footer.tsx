export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-12 text-white md:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[1.5fr_0.7fr_1fr]">
        <div>
          <div className="text-[17px] font-semibold tracking-tight text-white">DisasterIQ</div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">Learn. Prepare. Respond.</p>
          <p className="mt-3 max-w-[360px] text-sm leading-relaxed text-white/60">
            Interactive disaster preparedness, safety education, and campus response platform.
          </p>
        </div>

        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">Links</div>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <div>Learn</div>
            <div>Preparedness</div>
            <div>Quiz</div>
            <div>Emergency Guide</div>
            <div>About</div>
          </div>
        </div>

        <div className="text-sm text-white/70">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">Built for awareness.</div>
          <div className="mt-4">Designed for action.</div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] border-t border-white/5 pt-6 text-center">
        <p className="text-[11px] font-medium tracking-wider text-white/40 transition-colors duration-200 hover:text-white/70">
          Created with ❤️ by <span className="font-semibold text-white/60">Saurabh Mukherjee</span>
        </p>
      </div>
    </footer>
  );
}
