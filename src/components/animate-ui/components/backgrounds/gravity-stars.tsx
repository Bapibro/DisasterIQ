import { useEffect, useRef } from 'react';

interface GravityStarsBackgroundProps {
  className?: string;
  starsCount?: number;
  starColor?: string;
  gravityStrength?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
}

export function GravityStarsBackground({
  className = '',
  starsCount = 120,
  starColor = '255, 255, 255',
  gravityStrength = 0.008,
}: GravityStarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let isMouseOver = false;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Initialize stars
    const stars: Star[] = Array.from({ length: starsCount }, () => {
      const z = Math.random() * 0.8 + 0.2;
      return {
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        z,
        size: (Math.random() * 1.8 + 0.6) * z,
        baseAlpha: Math.random() * 0.6 + 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.2 * z,
        vy: (Math.random() - 0.5) * 0.2 * z,
      };
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseOver = true;
    };

    const handleMouseLeave = () => {
      isMouseOver = false;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = isMouseOver ? mouseX : width / 2;
      const centerY = isMouseOver ? mouseY : height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          // Twinkle effect
          star.alpha += star.twinkleSpeed;
          if (star.alpha > 0.95 || star.alpha < 0.15) {
            star.twinkleSpeed = -star.twinkleSpeed;
          }

          // Gentle gravity attraction towards center/cursor
          const dx = centerX - star.x;
          const dy = centerY - star.y;
          const distSq = dx * dx + dy * dy + 2000;
          const dist = Math.sqrt(distSq);

          const force = (gravityStrength * star.z) / (dist * 0.05 + 1);
          star.vx += (dx / dist) * force * 0.05;
          star.vy += (dy / dist) * force * 0.05;

          // Apply velocity & dampening
          star.vx *= 0.985;
          star.vy *= 0.985;

          star.x += star.vx;
          star.y += star.vy;

          // Wrap edges
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${star.alpha.toFixed(2)})`;
        ctx.shadowBlur = star.size > 1.2 ? 6 : 0;
        ctx.shadowColor = `rgba(${starColor}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [starsCount, starColor, gravityStrength]);

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full opacity-70" />
    </div>
  );
}
