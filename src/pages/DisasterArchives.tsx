import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { DisasterFilters, type ArchiveSort } from '../components/DisasterFilters';
import { DisasterSearch } from '../components/DisasterSearch';
import { DisasterStats } from '../components/DisasterStats';
import { DisasterTimeline } from '../components/DisasterTimeline';
import { DisasterTypeIntro } from '../components/DisasterTypeIntro';
import { DollyDisasterGallery } from '../components/DollyDisasterGallery';
import { archiveStats, disasterTypes, globalDisasters, type DisasterType } from '../data/globalDisasters';

const parseFatalityEstimate = (value: string) => {
  const matches = value.replaceAll(',', '').match(/\d+/g);
  return matches ? Number(matches[matches.length - 1]) : 0;
};

export function DisasterArchives() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [activeType, setActiveType] = useState<DisasterType | 'All'>('All');
  const [sort, setSort] = useState<ArchiveSort>('chronological');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | undefined>();

  useEffect(() => {
    const node = heroRef.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.from('[data-hero-item]', { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' });
    }, node);
    return () => context.revert();
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const next = globalDisasters.filter((event) => {
      const matchesType = activeType === 'All' || event.type === activeType;
      const searchable = `${event.name} ${event.country} ${event.location} ${event.year} ${event.type}`.toLowerCase();
      return matchesType && (!normalizedSearch || searchable.includes(normalizedSearch));
    });

    return next.sort((left, right) => {
      if (sort === 'alphabetical') return left.name.localeCompare(right.name);
      if (sort === 'recent') return right.year - left.year;
      if (sort === 'fatalities') return parseFatalityEstimate(right.deaths) - parseFatalityEstimate(left.deaths);
      return left.year - right.year;
    });
  }, [activeType, search, sort]);

  useEffect(() => {
    if (filteredEvents.length && !filteredEvents.some((event) => event.id === activeId)) {
      setActiveId(filteredEvents[0].id);
    }
  }, [activeId, filteredEvents]);

  return (
    <div className="relative overflow-hidden bg-[#020507]">
      <section ref={heroRef} className="relative flex min-h-[calc(100vh-6rem)] items-end overflow-hidden px-5 pb-16 pt-20 md:px-10 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,77,98,0.3),transparent_38%),linear-gradient(180deg,#020507,#020507_55%,#0a1115)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(2,5,7,1),transparent)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px]">
          <div data-hero-item className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">DisasterReady AI · Archive 01</div>
          <h1 data-hero-item className="mt-5 max-w-5xl text-6xl font-medium uppercase leading-[0.88] tracking-[-0.08em] text-white md:text-[clamp(5rem,12vw,12rem)]">The global<br />disaster archive</h1>
          <div className="mt-8 grid gap-8 md:grid-cols-[0.75fr_0.65fr] md:items-end">
            <p data-hero-item className="max-w-xl text-xl leading-tight text-white/70 md:text-2xl">A journey through the disasters that reshaped communities, cities, and history.</p>
            <p data-hero-item className="max-w-md text-sm leading-relaxed text-white/50">From earthquakes and floods to cyclones, wildfires, and volcanic eruptions, explore major disasters from around the world and understand what happened, where it happened, and what we can learn from them.</p>
          </div>
          <a data-hero-item href="#archive" className="mt-14 inline-flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">Scroll to explore <ArrowDown size={15} /></a>
        </div>
      </section>

      <DisasterTypeIntro />
      <DisasterStats stats={archiveStats} />

      <section id="archive" className="mx-auto max-w-[1440px] scroll-mt-28 px-5 pb-12 md:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[11px] uppercase tracking-[0.22em] text-white/45">The journey</p><h2 className="mt-3 text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl">Events that changed the map.</h2></div>
          <DisasterSearch value={search} onChange={setSearch} />
        </div>
        <DisasterFilters activeType={activeType} sort={sort} onTypeChange={setActiveType} onSortChange={setSort} />
        <div className="mt-6"><DisasterTimeline events={filteredEvents} activeId={activeId} onSelect={setActiveId} /></div>
        <div className="mt-8"><DollyDisasterGallery events={filteredEvents} activeId={activeId} onActiveChange={setActiveId} /></div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-40">
        <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(100,120,130,0.24),transparent_45%),#090f13] p-7 md:p-14">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">The archive continues</p>
          <h2 className="mt-5 max-w-4xl text-5xl font-medium tracking-[-0.07em] text-white md:text-8xl">History teaches.<br />Preparedness protects.</h2>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/60">Every disaster leaves behind more than destruction. It leaves lessons about preparation, response, resilience, and recovery.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/prepare" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-black">Explore preparedness <ArrowRight size={15} /></Link>
            <Link to="/quiz" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white">Take the quiz <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <div className="sr-only">Archive contains {globalDisasters.length} events across {disasterTypes.length} disaster categories.</div>
    </div>
  );
}
