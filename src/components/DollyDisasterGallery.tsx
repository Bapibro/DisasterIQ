import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { GlobalDisaster } from '../data/globalDisasters';
import { DisasterInfoPanel } from './DisasterInfoPanel';

gsap.registerPlugin(ScrollTrigger);

export function DollyDisasterGallery({ events, activeId, onActiveChange }: { events: GlobalDisaster[]; activeId?: string; onActiveChange: (id: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-archive-card]');
      cards.forEach((card) => {
        gsap.fromTo(card, { opacity: 0.16, scale: 0.72, y: 100, filter: 'brightness(0.35)' }, {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'brightness(1)',
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 34%', scrub: true, onEnter: () => onActiveChange(card.dataset.eventId ?? ''), onEnterBack: () => onActiveChange(card.dataset.eventId ?? '') },
        });
      });
    }, node);
    return () => context.revert();
  }, [events, onActiveChange]);

  if (!events.length) return <div className="py-24 text-center text-white/60">No events match this search.</div>;

  return (
    <div ref={ref} className="space-y-10 md:space-y-20">
      {events.map((event, index) => (
        <section key={event.id} data-archive-card data-event-id={event.id} className={`relative min-h-[78vh] scroll-mt-32 ${activeId === event.id ? 'is-active' : ''}`}>
          <div className="sticky top-32 overflow-hidden rounded-[30px] border border-white/10 bg-[#080d11] shadow-[0_35px_100px_rgba(0,0,0,0.6)]">
            <div className="relative h-[54vh] min-h-[360px] overflow-hidden md:h-[62vh]">
              <img src={event.image} alt={`${event.name}, ${event.location}`} loading={index < 3 ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,10,0.9),rgba(2,7,10,0.18)_65%,rgba(2,7,10,0.4)),linear-gradient(0deg,rgba(2,7,10,0.9),transparent_65%)]" />
              <div className="absolute inset-x-5 bottom-6 flex items-end justify-between gap-5 md:inset-x-8 md:bottom-9">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">{String(event.year).padStart(4, '0')} · {event.type}</div>
                  <h3 className="mt-3 text-4xl font-medium tracking-[-0.06em] text-white md:text-7xl">{event.name}</h3>
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/65">{event.location}, {event.country}</p>
                </div>
                <div className="hidden text-right md:block"><div className="text-3xl text-white">{index + 1}</div><div className="text-[10px] uppercase tracking-[0.18em] text-white/45">of {events.length}</div></div>
              </div>
            </div>
            <DisasterInfoPanel event={event} />
          </div>
        </section>
      ))}
    </div>
  );
}
