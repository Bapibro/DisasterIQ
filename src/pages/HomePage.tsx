import { ArrowRight, Backpack, Eye, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollExpand } from '../components/ScrollExpand';

const pillars = [
  {
    title: 'Awareness',
    description: 'Understand different disaster types and their warning signs before they escalate.',
    icon: Eye,
  },
  {
    title: 'Preparedness',
    description: 'Learn what to keep ready before an emergency occurs and how to build a safe routine.',
    icon: Backpack,
  },
  {
    title: 'Response',
    description: 'Know what actions to take during an emergency so calm decisions save time and lives.',
    icon: ShieldAlert,
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative isolate h-[100vh] min-h-[680px] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full scale-[1.08] object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260510_060007_60275ce7-030c-4668-a160-8f364ec537d3.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_55%)]" />

        <div className="relative z-10 flex h-full items-center justify-center px-5 pt-28">
          <div className="max-w-[1100px] text-center">
            <div className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/75">
              Readiness • Recovery • Response
            </div>
            <h1 className="mt-6 font-[Inter] text-[clamp(40px,5.4vw,72px)] font-normal leading-[1.1] tracking-[-0.02em] text-white">
              <span className="block">Prepare before disaster strikes.</span>
              <span className="block text-white/55">Learn. Respond. Recover.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[620px] text-[15px] leading-relaxed text-white">
              Disasters can happen anytime. Learn how to prepare, respond, and stay safe with interactive disaster education designed for students and institutions.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link
                to="/learn"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[15px] font-medium text-black shadow-[0_0_32px_4px_rgba(255,255,255,0.2)] transition-transform duration-200 hover:scale-[1.03]"
              >
                Start Learning
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic ScrollExpand Transition Section */}
      <ScrollExpand
        useWindowScroll={true}
        startWidth={42}
        startHeight={58}
        startRadius={24}
        endRadius={0}
        mediaZoom={1.3}
        scrollDistance={1.2}
        holdDistance={0.3}
        smoothing={0.08}
        overlayScrim={0.5}
        enabled={true}
        mediaUrl="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=2400&q=85"
        mediaType="image"
        title="Prepare Before It Happens"
        scrollHint="Scroll to explore"
        expandedTitle="Learn. Prepare. Respond."
        expandedDescription="DisasterIQ helps students and communities understand risks, prepare effectively, and respond with confidence."
        ctaText="Explore DisasterIQ"
        ctaLink="/learn"
      />

      <section className="mx-auto max-w-[1200px] px-5 py-24 md:px-10">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Why preparedness matters</p>
            <h2 className="mt-3 max-w-[800px] font-[Inter] text-4xl font-normal tracking-[-0.04em] text-white md:text-5xl">
              When seconds matter, preparation matters more.
            </h2>
          </div>
          <p className="max-w-[420px] text-sm leading-relaxed text-white/60">
            Students, schools, and colleges need practical safety knowledge well before emergencies happen so response becomes instinctive instead of reactive.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <div key={title} className="liquid-glass rounded-[24px] p-6">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                <Icon size={22} />
              </div>
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                {title === 'Awareness' ? '01' : title === 'Preparedness' ? '02' : '03'}
              </div>
              <h3 className="text-2xl font-medium text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-24 md:px-10">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.09),_transparent_60%)] px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="font-[Inter] text-4xl leading-[1.1] tracking-[-0.05em] text-white md:text-6xl">
            Preparedness is not fear.<br />
            It&apos;s confidence.
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-base text-white/70">
            Learn today so you know what to do tomorrow.
          </p>
          <Link
            to="/prepare"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[15px] font-medium text-black transition-transform duration-200 hover:scale-[1.03]"
          >
            Begin Your Safety Journey
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
