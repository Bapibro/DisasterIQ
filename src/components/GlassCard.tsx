import type { ReactNode } from 'react';

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`liquid-glass rounded-[24px] ${className}`}>{children}</div>;
}
