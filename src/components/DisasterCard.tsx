import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DisasterCard({
  title,
  description,
  Icon,
  to,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
  to: string;
}) {
  return (
    <Link to={to} className="group info-card liquid-glass block rounded-[22px] p-5 text-left transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <Icon size={20} />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">{title}</span>
      </div>
      <h3 className="text-2xl font-medium text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{description}</p>
      <div className="mt-5 flex items-center gap-2 text-sm text-white/80">
        <span>Learn more</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
