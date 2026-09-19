import { Building2, CheckCircle2 } from 'lucide-react';
import { BackgroundBoxes } from '../components/ui/background-boxes';

const campusMeasures = [
  'Clear emergency exits and signage',
  'Regular safety drills and briefings',
  'Visible first-aid and communication tools',
  'Designated reporting and response roles',
  'Safe assembly zones after evacuation',
  'Community awareness and tracking',
];

export function CampusPage() {
  return (
    <section className="relative isolate min-h-[calc(100vh-6rem)] w-full overflow-hidden px-5 py-12 md:px-10">
      <BackgroundBoxes className="z-0" />

      <div className="relative z-10 mx-auto grid max-w-[1200px] pointer-events-none gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="pointer-events-none liquid-glass rounded-[30px] p-6 md:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Campus safety culture</p>
          <h1 className="mt-3 font-[Inter] text-4xl font-normal tracking-[-0.04em] text-white md:text-5xl">
            Safer institutions start with prepared habits.
          </h1>
          <p className="mt-5 max-w-[520px] text-base leading-relaxed text-white/70">
            Schools and colleges are most resilient when students, faculty, and campus teams practice drills, share routes, and know their roles before emergencies begin.
          </p>
        </div>

        <div className="pointer-events-none liquid-glass rounded-[30px] p-6 md:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
            <Building2 size={24} />
          </div>
          <div className="space-y-4">
            {campusMeasures.map((measure) => (
              <div key={measure} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/2 p-3">
                <CheckCircle2 size={18} className="mt-0.5 text-emerald-300" />
                <span className="text-sm text-white/80">{measure}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
