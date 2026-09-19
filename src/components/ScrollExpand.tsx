import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ScrollExpand.css';

export interface ScrollExpandProps {
  useWindowScroll?: boolean;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  enabled?: boolean;
  mediaUrl?: string;
  mediaType?: 'video' | 'image';
  title?: string;
  scrollHint?: string;
  expandedTitle?: string;
  expandedDescription?: string;
  ctaText?: string;
  ctaLink?: string;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  useWindowScroll = true,
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.3,
  scrollDistance = 1.2,
  holdDistance = 0.3,
  smoothing = 0.08,
  overlayScrim = 0.5,
  enabled = true,
  mediaUrl = 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=2400&q=85',
  mediaType = 'image',
  title = 'Prepare Before It Happens',
  scrollHint = 'Scroll to explore',
  expandedTitle = 'Learn. Prepare. Respond.',
  expandedDescription = 'DisasterIQ helps students and communities understand risks, prepare effectively, and respond with confidence.',
  ctaText = 'Explore DisasterIQ',
  ctaLink = '/learn',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProgress(1);
      return;
    }

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setProgress(1);
      return;
    }

    const updateScrollProgress = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalScrollableDistance = rect.height - viewportHeight;

      if (totalScrollableDistance <= 0) return;

      // Calculate progress (0 when container top reaches top of viewport, 1 when container completes scroll)
      const scrolled = -rect.top;
      const rawProgress = Math.max(0, Math.min(1, scrolled / totalScrollableDistance));
      targetProgressRef.current = rawProgress;
    };

    const animate = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * smoothing;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      setProgress(currentProgressRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, smoothing, useWindowScroll]);

  // Calculate expand phase (0 to 1 during expansion)
  const totalWeight = scrollDistance + holdDistance;
  const expandRatio = scrollDistance / (totalWeight || 1);
  const expandProgress = Math.min(1, Math.max(0, progress / expandRatio));

  // Mobile viewport adjustments
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveStartWidth = isMobile ? Math.max(startWidth, 85) : startWidth;
  const effectiveStartHeight = isMobile ? Math.max(startHeight, 48) : startHeight;

  // Derived style values
  const currentWidth = effectiveStartWidth + (100 - effectiveStartWidth) * expandProgress;
  const currentHeight = effectiveStartHeight + (100 - effectiveStartHeight) * expandProgress;
  const currentRadius = startRadius + (endRadius - startRadius) * expandProgress;
  const currentMediaScale = mediaZoom - (mediaZoom - 1) * expandProgress;

  // Scrim and Opacities
  const currentScrimOpacity = Math.max(0, (expandProgress - 0.25) / 0.75) * overlayScrim;
  const initialOpacity = Math.max(0, 1 - expandProgress * 2.2);
  const expandedOpacity = Math.max(0, (expandProgress - 0.6) / 0.4);
  const expandedTranslateY = (1 - Math.max(0, (expandProgress - 0.6) / 0.4)) * 30;

  // Container height based on scrollDistance and holdDistance
  const containerHeightStyle = `${(scrollDistance + holdDistance + 1) * 100}vh`;

  return (
    <section
      ref={containerRef}
      className="scroll-expand-container"
      style={{ height: containerHeightStyle }}
    >
      <div className="scroll-expand-sticky">
        <div
          className="scroll-expand-card"
          style={{
            width: `${currentWidth}%`,
            height: `${currentHeight}vh`,
            borderRadius: `${currentRadius}px`,
          }}
        >
          {/* Media Element (Video or Image) */}
          <div className="scroll-expand-media-wrapper">
            {mediaType === 'video' ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="scroll-expand-media"
                style={{ transform: `scale(${currentMediaScale})` }}
              >
                <source src={mediaUrl} type="video/mp4" />
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt="Disaster Readiness Media"
                className="scroll-expand-media"
                style={{ transform: `scale(${currentMediaScale})` }}
              />
            )}
          </div>

          {/* Dark Overlay Scrim */}
          <div
            className="scroll-expand-scrim"
            style={{ opacity: currentScrimOpacity }}
          />

          {/* Initial Overlay (Title & Scroll Hint) */}
          <div
            className="scroll-expand-initial-overlay"
            style={{ opacity: initialOpacity }}
          >
            <h3 className="scroll-expand-initial-title">{title}</h3>
            {scrollHint && (
              <div className="scroll-expand-scroll-hint">
                <span className="scroll-expand-hint-dot" />
                <span>{scrollHint}</span>
              </div>
            )}
          </div>

          {/* Expanded Overlay (Final Content & CTA) */}
          <div
            className="scroll-expand-expanded-overlay"
            style={{
              opacity: expandedOpacity,
              transform: `translateY(${expandedTranslateY}px)`,
              pointerEvents: expandedOpacity > 0.3 ? 'auto' : 'none',
            }}
          >
            <div className="scroll-expand-content-box">
              <span className="scroll-expand-badge">DisasterIQ Awareness</span>
              <h2 className="scroll-expand-expanded-title">{expandedTitle}</h2>
              <p className="scroll-expand-expanded-desc">{expandedDescription}</p>
              {ctaText && (
                <Link to={ctaLink} className="scroll-expand-cta">
                  <span>{ctaText}</span>
                  <ArrowRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
