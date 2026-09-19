import { Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, ShieldAlert, X } from 'lucide-react';
import { disasterMap } from '../data/disasters';

export function DisasterDetailPage() {
  const { slug } = useParams();
  const disaster = slug ? disasterMap[slug] : undefined;

  if (!disaster) return <Navigate to="/learn" replace />;

  const Icon = disaster.icon;

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
      <div className="liquid-glass rounded-[32px] p-6 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
            <Icon size={24} />
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">Safety guide</div>
            <h1 className="mt-2 text-4xl font-medium tracking-[-0.04em] text-white md:text-5xl">{disaster.name}</h1>
          </div>
        </div>

        <p className="max-w-[720px] text-base leading-relaxed text-white/70">{disaster.description}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/2 p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
              <AlertTriangle size={14} />
              Warning signs
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {disaster.warningSigns.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-white/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/2 p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
              <ShieldAlert size={14} />
              Safety tips
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {disaster.safetyTips.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/2 p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
              <Check size={14} />
              Before
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {disaster.before.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/2 p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-300">
              <AlertTriangle size={14} />
              During
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {disaster.during.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-amber-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/2 p-5">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-300">
              <X size={14} />
              After
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {disaster.after.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-rose-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
