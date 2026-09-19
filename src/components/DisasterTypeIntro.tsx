import { Activity, CloudLightning, Flame, Mountain, Waves, Wind } from 'lucide-react';

const types = [
  { label: 'Earthquakes', icon: Activity },
  { label: 'Floods', icon: Waves },
  { label: 'Wildfires', icon: Flame },
  { label: 'Cyclones', icon: Wind },
  { label: 'Volcanoes', icon: Mountain },
  { label: 'Lightning', icon: CloudLightning },
];

export function DisasterTypeIntro() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">A vocabulary of risk</p>
          <h2 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-white md:text-6xl">Disasters take many forms.</h2>
        </div>
        <p className="max-w-xl text-base leading-relaxed text-white/60">
          The archive moves across hazards, places, and centuries. Every event is different, but patterns repeat: exposure, warning, response, recovery, and the choices that shape what happens next.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {types.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/70 transition-colors hover:bg-white/[0.08]">
            <Icon size={20} strokeWidth={1.4} />
            <div className="mt-8 text-[10px] font-medium uppercase tracking-[0.14em]">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
