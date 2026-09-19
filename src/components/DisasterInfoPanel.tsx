import { ArrowUpRight, BookOpen, MapPin, ShieldCheck } from 'lucide-react';
import type { GlobalDisaster } from '../data/globalDisasters';

export function DisasterInfoPanel({ event }: { event: GlobalDisaster }) {
  return (
    <article className="relative z-10 -mt-8 rounded-[28px] border border-white/10 bg-[#0a1116]/90 p-5 shadow-2xl backdrop-blur-xl md:-mt-20 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
            <span>{event.type}</span><span className="h-1 w-1 rounded-full bg-white/30" /><span>{event.year}</span>
          </div>
          <h3 className="mt-4 max-w-2xl text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">{event.name}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/60"><MapPin size={15} />{event.location}, {event.country}</div>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70">{event.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 self-start">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Deaths</div><div className="mt-2 text-lg text-white">{event.deaths}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Date</div><div className="mt-2 text-lg text-white">{event.date ?? event.year}</div></div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Affected / loss</div><div className="mt-2 text-sm leading-relaxed text-white/80">{event.affected}{event.economicLoss ? ` · ${event.economicLoss}` : ''}</div></div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
        <div><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/40"><BookOpen size={14} />What caused it?</div><p className="mt-3 text-sm leading-relaxed text-white/70">{event.cause}</p></div>
        <div><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/40"><ArrowUpRight size={14} />What followed?</div><ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">{event.consequences.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        <div><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/40"><ShieldCheck size={14} />Lessons for today</div><ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">{event.lessonsLearned.map((item) => <li key={item}>• {item}</li>)}</ul></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.14em] text-white/35">
        <span>Sources</span>{event.sources.map((item) => <a key={item} href={item} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/60 hover:text-white">Reference <ArrowUpRight size={11} /></a>)}
      </div>
    </article>
  );
}
