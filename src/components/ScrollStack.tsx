import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export interface ScrollStackProps {
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string | number;
  scaleEndPosition?: string | number;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface ScrollStackItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  className = '',
  style = {},
}) => {
  return (
    <div className={`scroll-stack-item ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export const ScrollStack: React.FC<ScrollStackProps> = ({
  itemDistance = 100,
  itemScale = 0.035,
  itemStackDistance = 35,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.86,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    if (useWindowScroll) {
      try {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.5,
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };

        rafId = requestAnimationFrame(raf);
      } catch (err) {
        console.warn('Lenis initialization warning:', err);
      }
    }

    return () => {
      if (lenis) {
        lenis.destroy();
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [useWindowScroll]);

  // Convert stackPosition and scaleEndPosition to CSS formats
  const topPosition = typeof stackPosition === 'number' ? `${stackPosition}px` : stackPosition;
  const endPosition = typeof scaleEndPosition === 'number' ? `${scaleEndPosition}px` : scaleEndPosition;

  // Process children and pass index-based stacking variables
  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;

  return (
    <div className={`scroll-stack-wrapper ${className}`.trim()}>
      <div
        ref={containerRef}
        className="scroll-stack-container"
        style={{
          '--item-distance': `${itemDistance}px`,
          '--end-position': endPosition,
        } as React.CSSProperties}
      >
        {childrenArray.map((child, index) => {
          if (!React.isValidElement(child)) return child;

          const stackTopOffset = `calc(${topPosition} + ${index * itemStackDistance}px)`;
          const scaleFactor = Math.max(0.6, baseScale + (index - (totalItems - 1)) * itemScale);
          const rotation = rotationAmount !== 0 ? `rotate(${index * rotationAmount}deg)` : '';

          return React.cloneElement(child as React.ReactElement<ScrollStackItemProps>, {
            style: {
              ...((child.props as ScrollStackItemProps).style || {}),
              top: stackTopOffset,
              zIndex: index + 1,
              transform: `scale(${scaleFactor}) ${rotation}`.trim(),
              filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
              transition: `transform ${scaleDuration}s cubic-bezier(0.16, 1, 0.3, 1), filter ${scaleDuration}s ease`,
            },
          });
        })}
      </div>
    </div>
  );
};
