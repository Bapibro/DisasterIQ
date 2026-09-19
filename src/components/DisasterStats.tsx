import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function DisasterStats({ stats }: { stats: { events: number; countries: number; types: number; years: number } }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const numbers = node.querySelectorAll<HTMLElement>('[data-stat]');
    const context = gsap.context(() => {
      numbers.forEach((number) => {
        const value = Number(number.dataset.stat ?? 0);
        const counter = { value: 0 };
        gsap.to(counter, {
          value,
          duration: 1.4,
          ease: 'power2.out',
          snap: { value: 1 },
          scrollTrigger: { trigger: node, start: 'top 80%', once: true },
          onUpdate: () => {
            number.textContent = Math.round(counter.value).toString();
          },
        });
      });
    }, node);
    return () => context.revert();
  }, []);

  const statsList = [
    { value: stats.events, label: 'Documented events' },
    { value: stats.countries, label: 'Countries & regions' },
    { value: stats.types, label: 'Disaster types' },
    { value: stats.years, label: 'Years of history' },
  ];

  return (
    <section ref={ref} className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-white/10 bg-white/10 md:grid-cols-4">
        {statsList.map((stat) => (
          <div key={stat.label} className="bg-[#080d11] p-5 md:p-8">
            <div className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl" data-stat={stat.value}>0</div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/45">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
