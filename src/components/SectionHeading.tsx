export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">{eyebrow}</p>
      <h2 className="mt-3 max-w-[850px] font-[Inter] text-4xl font-normal tracking-[-0.04em] text-white md:text-5xl">
        {title}
      </h2>
      {description ? <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-white/60">{description}</p> : null}
    </div>
  );
}
