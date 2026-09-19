import { BellRing, Building2, FlameKindling, Phone, ShieldAlert, ShieldPlus, Siren } from 'lucide-react';
import { GravityStarsBackground } from '@/components/animate-ui/components/backgrounds/gravity-stars';

const emergencyContacts = [
  { label: 'National Emergency', number: '112', icon: Siren },
  { label: 'Fire', number: '101', icon: FlameKindling },
  { label: 'Police', number: '100', icon: ShieldPlus },
  { label: 'Ambulance', number: '108', icon: BellRing },
  { label: 'Disaster Management', number: '1078', icon: ShieldAlert },
];

const campusSystems = [
  'Emergency evacuation plans',
  'Mock drills',
  'Student awareness',
  'Emergency communication',
  'First-aid training',
  'Disaster response teams',
];

export function GuidePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <GravityStarsBackground className="absolute inset-0 flex items-center justify-center z-0" />
      <div className="relative z-10">
        <section className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
          <div className="mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Emergency contacts</p>
            <h2 className="mt-3 font-[Inter] text-4xl font-normal tracking-[-0.04em] text-white">Critical numbers, ready when needed.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {emergencyContacts.map(({ label, number, icon: Icon }) => (
              <div key={label} className="liquid-glass rounded-[22px] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                  <Icon size={18} />
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">{label}</div>
                <div className="mt-3 text-2xl font-medium text-white">{number}</div>
                <a href={`tel:${number}`} className="mt-5 inline-flex items-center gap-2 text-sm text-white/80">
                  Call now <Phone size={14} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-24 md:px-10">
          <div className="mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">School & college safety</p>
            <h2 className="mt-3 font-[Inter] text-4xl font-normal tracking-[-0.04em] text-white md:text-5xl">Safer campuses start with prepared people.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {campusSystems.map((item) => (
              <div key={item} className="liquid-glass rounded-[22px] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                  <Building2 size={18} />
                </div>
                <p className="text-lg text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
