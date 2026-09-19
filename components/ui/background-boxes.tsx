import { motion } from 'motion/react';
import type { HTMLAttributes } from 'react';

const colors = ['#13B5EA', '#7C3AED', '#F59E0B', '#10B981', '#EF4444'];

export function BackgroundBoxes({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pointer-events-auto absolute inset-0 overflow-hidden ${className}`} {...props}>
      <BoxesCore />
    </div>
  );
}

function BoxesCore() {
  const rows = new Array(48).fill(1);
  const columns = new Array(32).fill(1);

  return (
    <div
      aria-hidden="true"
      className="absolute flex flex-col opacity-80"
      style={{ left: '-5%', top: '-5%', transform: 'skewX(-12deg) skewY(4deg) scale(0.9) rotate(0deg) translateZ(0)', transformOrigin: 'top left' }}
    >
      {rows.map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {columns.map((_, columnIndex) => (
            <motion.div
              key={`box-${rowIndex}-${columnIndex}`}
              whileHover={{ backgroundColor: colors[(rowIndex + columnIndex) % colors.length], opacity: 1 }}
               onPointerEnter={(event) => {
                 event.currentTarget.style.backgroundColor = colors[(rowIndex + columnIndex) % colors.length];
               }}
               onPointerLeave={(event) => {
                 event.currentTarget.style.backgroundColor = 'transparent';
               }}
              className="relative h-8 w-16 border-l border-t border-white/[0.2] bg-transparent"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
