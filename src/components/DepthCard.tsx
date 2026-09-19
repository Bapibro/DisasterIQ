import { useCallback, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export function DepthCard({
  children,
  className = '',
  intensity = 14,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * intensity * 2;
      const rotateX = (0.5 - y) * intensity * 2;
      const glowX = x * 100;
      const glowY = y * 100;

      setRotation({ x: rotateX, y: rotateY, glowX, glowY });
    },
    [intensity],
  );

  const handleMouseLeave = useCallback(() => {
    setRotation({ x: 0, y: 0, glowX: 50, glowY: 50 });
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_20px_90px_rgba(0,0,0,0.55)] transition-transform duration-300 ${className}`}
      style={{
        transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(-4px)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at ${rotation.glowX}% ${rotation.glowY}%, rgba(255,255,255,0.22), transparent 38%)`,
        }}
      />
      <div className="absolute inset-[1px] rounded-[27px] bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02),rgba(255,255,255,0.06))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
