import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  FileWarning,
  Map,
  Phone,
  ShieldAlert,
  Workflow,
} from 'lucide-react';
import './OperationalModulePage.css';

type ModuleDefinition = {
  path: string;
  title: string;
  group: string;
  summary: string;
  currentLimit: string;
  currentAction?: { label: string; href: string };
  phase: string;
};

const modules: ModuleDefinition[] = [
  {
    path: '/flood-prediction',
    title: 'Flood Prediction',
    group: 'Disaster intelligence',
    summary: 'Rainfall and flood-susceptibility analysis for Nagpur, with every signal tied to its source and timestamp.',
    currentLimit: 'No verified local elevation, drainage, historical incident, or training dataset is connected. A flood prediction or locality risk category cannot be responsibly displayed yet.',
    currentAction: { label: 'View live rainfall and radar', href: '/live-monitoring' },
    phase: 'Phase 2 · data and model assessment',
  },
  {
    path: '/heatwave-monitoring',
    title: 'Heatwave Monitoring',
    group: 'Disaster intelligence',
    summary: 'A focused view of heat exposure, temperature trends, model forecasts, and official heat alerts.',
    currentLimit: 'This module is not yet connected to a live weather feed or official heat-warning feed. No alert or exposure estimate is being inferred.',
    currentAction: { label: 'View current weather', href: '/live-monitoring' },
    phase: 'Phase 2 · weather intelligence',
  },
  {
    path: '/storm-monitoring',
    title: 'Storm & Lightning',
    group: 'Disaster intelligence',
    summary: 'Severe-weather monitoring with timestamped wind, precipitation, radar, and official warnings.',
    currentLimit: 'No verified lightning-strike source or browser-accessible IMD warning feed is connected. Radar imagery is not a lightning observation.',
    currentAction: { label: 'View live radar', href: '/live-monitoring' },
    phase: 'Phase 2 · weather intelligence',
  },
  {
    path: '/safe-routes',
    title: 'Safe Routes',
    group: 'Emergency response',
    summary: 'Route planning for reaching a destination during an emergency, with clear distinctions between routing and verified safety.',
    currentLimit: 'No routing engine or verified road closure, flood, or evacuation data is connected. Ordinary map routes must not be treated as verified safe routes.',
    currentAction: { label: 'Open Nagpur monitoring map', href: '/live-monitoring' },
    phase: 'Phase 3 · routing and verified hazards',
  },
  {
    path: '/incident-reporting',
    title: 'Incident Reporting',
    group: 'Emergency response',
    summary: 'A citizen reporting workflow for location-aware incidents, verification, and status history.',
    currentLimit: 'Offline report preparation and local queuing are available on the Offline Emergency page. Online submission remains unavailable until the incident_reports migration is applied to Supabase.',
    currentAction: { label: 'Open offline reporting', href: '/offline-emergency' },
    phase: 'Phase 3 · Supabase migration and reporting',
  },
  {
    path: '/emergency-alerts',
    title: 'Emergency Alerts',
    group: 'Emergency response',
    summary: 'A source-attributed view of active official warnings and their issue and expiry times.',
    currentLimit: 'There are no verified official alert records available in this app. IMD’s published warning feed is not CORS-accessible here; no alerts are generated or displayed as live.',
    currentAction: { label: 'Open official IMD portal', href: 'https://mausam.imd.gov.in/' },
    phase: 'Phase 3 · official alert integration',
  },
  {
    path: '/response-center',
    title: 'Response Center',
    group: 'Emergency response',
    summary: 'A role-protected operations workspace for reviewing and coordinating verified incidents.',
    currentLimit: 'There is no incident backend or server-enforced incident authorization in this project yet. Administrative controls are intentionally not exposed based on client-side roles.',
    phase: 'Phase 4 · authorization and operations',
  },
  {
    path: '/ai-intelligence',
    title: 'AI Intelligence',
    group: 'Disaster intelligence',
    summary: 'Explainable analysis backed by documented datasets and evaluated models—not a simulated chatbot.',
    currentLimit: 'No suitable local labeled training dataset or ML service is present. Model scores, risk predictions, and feature importance are therefore not available.',
    phase: 'Phase 5 · dataset and model evaluation',
  },
];

export function OperationalModulePage() {
  const { pathname } = useLocation();
  const module = modules.find((item) => item.path === pathname);

  if (!module) return null;

  const isExternal = module.currentAction?.href.startsWith('https://') ?? false;

  return (
    <main className="operational-module">
      <div className="operational-module__shell">
        <div className="operational-module__breadcrumb">
          <Workflow size={14} />
          <span>{module.group}</span>
          <span aria-hidden="true">/</span>
          <span>{module.title}</span>
        </div>

        <header className="operational-module__header">
          <div className="operational-module__eyebrow"><Activity size={14} /> DISASTERIQ · NAGPUR</div>
          <h1>{module.title}</h1>
          <p>{module.summary}</p>
        </header>

        <section className="operational-module__status" aria-labelledby="module-status-heading">
          <div className="operational-module__status-icon"><FileWarning size={19} /></div>
          <div className="operational-module__status-copy">
            <div className="operational-module__status-label">DATA / CAPABILITY STATUS</div>
            <h2 id="module-status-heading">Not available yet</h2>
            <p>{module.currentLimit}</p>
          </div>
        </section>

        <div className="operational-module__details">
          <section className="operational-module__card">
            <span className="operational-module__card-icon"><Map size={17} /></span>
            <h2>What this module will provide</h2>
            <p>
              Data-backed information with provider attribution, observation or forecast labels, timestamps, and explicit
              availability states. Unverified reports and model estimates will not be presented as confirmed incidents.
            </p>
            <span className="operational-module__phase">{module.phase}</span>
          </section>

          <section className="operational-module__card operational-module__safety">
            <span className="operational-module__card-icon"><ShieldAlert size={17} /></span>
            <h2>For immediate danger</h2>
            <p>Call India’s emergency response number. This dashboard is not an official emergency-warning system.</p>
            <a className="operational-module__call" href="tel:112"><Phone size={15} /> Call 112</a>
          </section>
        </div>

        <nav className="operational-module__actions" aria-label="Related resources">
          {module.currentAction && (
            isExternal ? (
              <a className="operational-module__primary-link" href={module.currentAction.href} target="_blank" rel="noreferrer">
                {module.currentAction.label} <ExternalLink size={14} />
              </a>
            ) : (
              <Link className="operational-module__primary-link" to={module.currentAction.href}>
                {module.currentAction.label} <ArrowRight size={14} />
              </Link>
            )
          )}
          <Link className="operational-module__secondary-link" to="/live-monitoring">
            Nagpur Live Monitoring <ArrowRight size={14} />
          </Link>
        </nav>
      </div>
    </main>
  );
}

export default OperationalModulePage;
