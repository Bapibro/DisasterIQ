import { DisasterCard } from '../components/DisasterCard';
import { SectionHeading } from '../components/SectionHeading';
import { disasters } from '../data/disasters';
import { FloatingLines } from '../components/FloatingLines/FloatingLines';

export function LearnPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <FloatingLines
        enabledWaves={['top', 'middle', 'bottom']}
        lineCount={[8, 12, 16]}
        lineDistance={[8, 6, 4]}
        bendRadius={5}
        bendStrength={-0.5}
        interactive={true}
        parallax={true}
        parallaxStrength={0.15}
        animationSpeed={0.7}
      />

      <section className="relative z-10 mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <SectionHeading
          eyebrow="Disaster learning hub"
          title="Know the disaster. Know the response."
          description="Each emergency type has unique risks, warning signs, and action steps. Build a practical understanding before danger appears."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {disasters.map(({ slug, name, description, icon }) => (
            <DisasterCard key={slug} title={name} description={description} Icon={icon} to={`/learn/${slug}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
