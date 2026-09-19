import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './IntroLoader.css';

declare global {
  interface Window {
    resetDisasterIQIntro?: () => void;
  }
}

export const IntroLoader: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('disasteriq_intro_shown');
    } catch {
      return true;
    }
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Expose testing helper on window
    window.resetDisasterIQIntro = () => {
      try {
        sessionStorage.removeItem('disasteriq_intro_shown');
        window.location.reload();
      } catch (e) {
        console.warn('Could not reset intro:', e);
      }
    };

    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        try {
          sessionStorage.setItem('disasteriq_intro_shown', 'true');
        } catch {}
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem('disasteriq_intro_shown', 'true');
          } catch (e) {
            console.warn('sessionStorage set error:', e);
          }
          setIsVisible(false);
        },
      });

      // Step 1: Initial state
      gsap.set(titleRef.current, { opacity: 0, y: 30 });
      gsap.set(taglineRef.current, { opacity: 0, y: 15 });

      // Step 2: Animate text appearance
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
      })
        .to(
          taglineRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          },
          '-=0.3'
        )
        // Step 3: Hold branding briefly
        .to({}, { duration: 1.0 })
        // Step 4: Slide entire intro overlay upward smoothly
        .to(overlayRef.current, {
          yPercent: -100,
          duration: 0.95,
          ease: 'power4.inOut',
        });
    }, overlayRef);

    return () => {
      ctx.revert();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div ref={overlayRef} className="intro-loader-overlay">
      <div className="intro-loader-content">
        <div className="intro-loader-title-wrapper">
          <h1 ref={titleRef} className="intro-loader-title">
            Disaster<span>IQ</span>
          </h1>
        </div>
        <div className="intro-loader-tagline-wrapper">
          <div ref={taglineRef} className="intro-loader-tagline">
            Learn. Prepare. Respond.
          </div>
        </div>
      </div>
    </div>
  );
};
