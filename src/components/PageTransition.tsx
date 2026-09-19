import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!wrapperRef.current) return;

    if (reduceMotion) {
      gsap.set(wrapperRef.current, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      wrapperRef.current,
      { autoAlpha: 0.55, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' },
    );
  }, [location.pathname]);

  return <div ref={wrapperRef}>{children}</div>;
}
