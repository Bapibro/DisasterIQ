import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardPlus,
  Clock3,
  CloudOff,
  HardDrive,
  Info,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Siren,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { offlineEmergencyGuides } from '../data/offlineGuides';
import {
  useOfflineIncidentReports,
  type IncidentReportStatus,
  type QueuedIncidentReport,
} from '../hooks/useOfflineIncidentReports';
import {
  incidentPriorities,
  incidentTypes,
  type IncidentPriority,
  type IncidentReportInput,
  type IncidentType,
} from '../lib/services/incidentReportService';
import './OfflineEmergencyPage.css';

const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const incidentLabels: Record<IncidentType, string> = {
  earthquake: 'Earthquake',
  flood: 'Flood',
  fire: 'Fire',
  lightning: 'Lightning',
  cyclone: 'Cyclone',
  heatwave: 'Heatwave',
  other: 'Other incident',
};

const priorityLabels: Record<IncidentPriority, string> = {
  immediate: 'Immediate danger',
  urgent: 'Urgent',
  'non-urgent': 'Non-urgent',
};

const statusDetails: Record<IncidentReportStatus, { label: string; description: string }> = {
  pending: { label: 'Pending', description: 'Saved on this device. Not submitted.' },
  syncing: { label: 'Syncing', description: 'Waiting for backend confirmation.' },
  submitted: { label: 'Submitted', description: 'Accepted and confirmed by the backend.' },
  failed: { label: 'Failed', description: 'Not confirmed. The report remains saved for retry.' },
};

const initialForm: IncidentReportInput = {
  incidentType: 'flood',
  location: '',
  description: '',
  priority: 'urgent',
};

function ReportStatusBadge({ status }: { status: IncidentReportStatus }) {
  const Icon = status === 'submitted' ? CheckCircle2 : status === 'syncing' ? LoaderCircle : status === 'failed' ? AlertCircle : Clock3;
  return (
    <span className={`offline-emergency__report-status offline-emergency__report-status--${status}`} role="status">
      <Icon size={13} className={status === 'syncing' ? 'offline-emergency__spin' : undefined} />
      {statusDetails[status].label}
    </span>
  );
}

function ReportCard({
  report,
  onRemove,
}: {
  report: QueuedIncidentReport;
  onRemove: (report: QueuedIncidentReport) => void;
}) {
  return (
    <article className="offline-emergency__report">
      <div className="offline-emergency__report-topline">
        <ReportStatusBadge status={report.status} />
        <span>{priorityLabels[report.priority]}</span>
      </div>
      <h3>{incidentLabels[report.incidentType]}</h3>
      <p className="offline-emergency__report-location"><MapPin size={14} /> {report.location}</p>
      <p className="offline-emergency__report-description">{report.description}</p>
      <p className="offline-emergency__report-explanation">{statusDetails[report.status].description}</p>
      {report.lastError && <p className="offline-emergency__report-error" role="alert">{report.lastError}</p>}
      {report.confirmation && (
        <p className="offline-emergency__report-confirmation">
          <Check size={13} /> Backend confirmed · {report.confirmation.status.replace('_', ' ')} · Reference: {report.confirmation.id}
        </p>
      )}
      <div className="offline-emergency__report-footer">
        <span>Saved {dateFormatter.format(new Date(report.createdAt))}</span>
        <button type="button" onClick={() => onRemove(report)} disabled={report.status === 'syncing'}>
          <Trash2 size={13} /> {report.status === 'submitted' ? 'Remove from device' : 'Remove'}
        </button>
      </div>
    </article>
  );
}

export default function OfflineEmergencyPage() {
  const { user, isSupabaseActive } = useAuth();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(() => Boolean(navigator.serviceWorker?.controller));
  const [form, setForm] = useState<IncidentReportInput>(initialForm);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { reports, unclaimedCount, storageError, saveReport, syncReports, removeReport, claimAnonymousReports } =
    useOfflineIncidentReports(isOnline, user?.id ?? null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;
    const handleControllerChange = () => {
      if (active) setOfflineReady(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.ready
      .then(() => {
        if (active) setOfflineReady(true);
      })
      .catch(() => {
        if (active) setOfflineReady(false);
      });

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleSaveReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setFormMessage(null);

    const location = form.location.trim();
    const description = form.description.trim();
    if (location.length < 2 || description.length < 12) {
      setFormMessage({ type: 'error', text: 'Enter a clear location and at least 12 characters describing what happened.' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveReport({ ...form, location, description });
      if (!saved) {
        setFormMessage({ type: 'error', text: 'The report could not be stored on this device. It has not been saved or submitted.' });
        return;
      }

      setForm(initialForm);
      setFormMessage({
        type: 'success',
        text: isOnline && user
          ? 'Saved on this device. Submission is being attempted; check the confirmed status below.'
          : 'Saved in this device’s pre-sign-in queue. It is not submitted yet; sign in and attach it to retry online.',
      });

      if (isOnline && user) void syncReports();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClaimReports = async () => {
    if (isClaiming || !window.confirm(`Attach ${unclaimedCount} pre-sign-in report(s) to your account? They will be submitted as your reports when online.`)) return;
    setIsClaiming(true);
    try {
      const claimed = await claimAnonymousReports();
      if (claimed) {
        setFormMessage({ type: 'success', text: 'Pre-sign-in reports were attached to your account. Check their confirmed status in the queue.' });
        if (isOnline) void syncReports();
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRemoveReport = (report: QueuedIncidentReport) => {
    const message = report.status === 'submitted'
      ? 'Remove this submitted report from this device? The backend record will not be deleted.'
      : 'Remove this unsent report from this device? This cannot be undone.';
    if (window.confirm(message)) void removeReport(report.id);
  };

  const pendingCount = reports.filter((report) => report.status === 'pending' || report.status === 'failed').length;
  const submittedCount = reports.filter((report) => report.status === 'submitted').length;
  const isSyncing = reports.some((report) => report.status === 'syncing');

  return (
    <div className="offline-emergency">
      <div className="offline-emergency__shell">
        <div className="offline-emergency__breadcrumb">
          <ShieldCheck size={14} />
          <span>Emergency response</span>
          <span aria-hidden="true">/</span>
          <span>Offline emergency</span>
        </div>

        <header className="offline-emergency__header">
          <div>
            <p className="offline-emergency__eyebrow">DisasterIQ · Preparedness without a connection</p>
            <h1>Offline<br /> Emergency</h1>
            <p className="offline-emergency__intro">
              Essential safety instructions, emergency calling, and a durable incident-report queue—available when the network is not.
            </p>
          </div>

          <aside className="offline-emergency__call-card" id="emergency-contact" aria-labelledby="emergency-contact-title">
            <div className="offline-emergency__call-icon"><Siren size={23} /></div>
            <p className="offline-emergency__card-label">National emergency · India</p>
            <h2 id="emergency-contact-title">112</h2>
            <p>For immediate danger, call emergency services. An incident report does not alert responders.</p>
            <a href="tel:112" className="offline-emergency__call-button"><Phone size={17} /> Call 112</a>
            <span>The dialer needs mobile service, but not internet access.</span>
          </aside>
        </header>

        <section className={`offline-emergency__connection ${isOnline ? 'is-online' : 'is-offline'}`} role="status" aria-live="polite">
          <div className="offline-emergency__connection-icon">{isOnline ? <Wifi size={19} /> : <WifiOff size={19} />}</div>
          <div>
            <strong>{isOnline ? 'Online' : 'Offline'}</strong>
            <span>{isOnline ? 'Device reports a network connection. Live weather and maps still require internet.' : 'Saved guides and this device’s report queue remain available.'}</span>
          </div>
          <span className="offline-emergency__connection-mode">{isOnline ? 'NETWORK CONNECTED' : 'OFFLINE MODE'}</span>
        </section>

        <nav className="offline-emergency__quick-links" aria-label="Offline emergency sections">
          <a href="#guides"><BookOpen size={15} /> Safety guides</a>
          <a href="#reports"><ClipboardPlus size={15} /> Incident reports</a>
          <a href="#emergency-contact"><Phone size={15} /> Emergency contact</a>
        </nav>

        <section className="offline-emergency__readiness" aria-label="Offline readiness and data boundaries">
          <article>
            <ShieldCheck size={20} />
            <div><strong>{offlineReady ? 'Offline copy ready' : 'Static guides included'}</strong><span>{offlineReady ? 'Essential app files are cached on this device.' : 'Open the production site once online to enable refresh access without internet.'}</span></div>
          </article>
          <article>
            <CloudOff size={20} />
            <div><strong>No live data offline</strong><span>Weather, radar, alerts, and live maps are not available without a connection.</span></div>
          </article>
          <article>
            <LockKeyhole size={20} />
            <div><strong>Private data excluded</strong><span>The service-worker cache excludes account tokens and backend responses. Never enter medical details in reports.</span></div>
          </article>
        </section>

        <section className="offline-emergency__section" id="guides" aria-labelledby="guides-title">
          <div className="offline-emergency__section-heading">
            <div>
              <p className="offline-emergency__card-label">Offline-readable</p>
              <h2 id="guides-title">Safety guides</h2>
            </div>
            <p>Six complete guides. Open one for immediate actions, mistakes to avoid, and before, during, and after steps.</p>
          </div>

          <div className="offline-emergency__guides">
            {offlineEmergencyGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <details className="offline-emergency__guide" key={guide.id}>
                  <summary>
                    <span className="offline-emergency__guide-icon"><Icon size={21} /></span>
                    <span className="offline-emergency__guide-summary"><strong>{guide.name}</strong><span>{guide.summary}</span></span>
                    <ChevronDown size={17} className="offline-emergency__guide-chevron" />
                  </summary>
                  <div className="offline-emergency__guide-content">
                    <section className="offline-emergency__guide-immediate">
                      <h3><AlertTriangle size={15} /> Do this immediately</h3>
                      <ul>{guide.immediate.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                    <section className="offline-emergency__guide-avoid">
                      <h3><AlertCircle size={15} /> What not to do</h3>
                      <ul>{guide.avoid.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                    <div className="offline-emergency__guide-phases">
                      <section><h3>Before</h3><ul>{guide.before.map((item) => <li key={item}>{item}</li>)}</ul></section>
                      <section><h3>During</h3><ul>{guide.during.map((item) => <li key={item}>{item}</li>)}</ul></section>
                      <section><h3>After</h3><ul>{guide.after.map((item) => <li key={item}>{item}</li>)}</ul></section>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
          <p className="offline-emergency__guide-note"><Info size={14} /> General safety guidance only. Follow instructions from local authorities and emergency responders.</p>
        </section>

        <section className="offline-emergency__section" id="reports" aria-labelledby="reports-title">
          <div className="offline-emergency__section-heading">
            <div>
              <p className="offline-emergency__card-label">Stored on this device</p>
              <h2 id="reports-title">Offline incident reports</h2>
            </div>
            <p>Prepare a report without internet. Account reports retry automatically when online; pre-sign-in reports must be attached explicitly.</p>
          </div>

          <div className="offline-emergency__report-notice">
            <AlertTriangle size={18} />
            <p><strong>This is not an emergency dispatch service.</strong> If anyone is in immediate danger, call <a href="tel:112">112</a>. A report is submitted only after the backend confirms it.</p>
          </div>

          <div className="offline-emergency__reports-layout">
            <form className="offline-emergency__report-form" onSubmit={handleSaveReport}>
              <div className="offline-emergency__form-heading"><ClipboardPlus size={19} /><div><h3>Prepare a report</h3><p>Required fields are marked with an asterisk.</p></div></div>

              <label>
                Incident type <span aria-hidden="true">*</span>
                <select value={form.incidentType} onChange={(event) => setForm({ ...form, incidentType: event.target.value as IncidentType })} required>
                  {incidentTypes.map((type) => <option key={type} value={type}>{incidentLabels[type]}</option>)}
                </select>
              </label>

              <label>
                Location <span aria-hidden="true">*</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Area, landmark, or address"
                  minLength={2}
                  maxLength={160}
                  required
                />
              </label>

              <label>
                What is happening? <span aria-hidden="true">*</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe the hazard, visible damage, and anyone who may be trapped. Do not include names, phone numbers, or medical details."
                  minLength={12}
                  maxLength={1200}
                  rows={5}
                  required
                />
                <span className="offline-emergency__field-hint">{form.description.length}/1200 · Incident facts only; no private medical information.</span>
              </label>

              <label>
                Priority <span aria-hidden="true">*</span>
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as IncidentPriority })} required>
                  {incidentPriorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                </select>
              </label>

              {form.priority === 'immediate' && (
                <p className="offline-emergency__form-warning"><Phone size={14} /> Immediate danger? Call <a href="tel:112">112</a> now. Do not wait for this report.</p>
              )}

              <button type="submit" className="offline-emergency__primary-button" disabled={isSaving}>
                {isSaving ? <LoaderCircle size={16} className="offline-emergency__spin" /> : <HardDrive size={16} />}
                {isSaving ? 'Saving on this device…' : 'Save report on this device'}
              </button>

              {formMessage && <p className={`offline-emergency__form-message offline-emergency__form-message--${formMessage.type}`} role="status">{formMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{formMessage.text}</p>}
              {storageError && <p className="offline-emergency__form-message offline-emergency__form-message--error" role="alert"><AlertCircle size={15} />{storageError}</p>}

              {!user && (
                <div className="offline-emergency__auth-note">
                  <LockKeyhole size={16} />
                  <div><strong>Sign-in required to submit</strong><span>{isSupabaseActive ? 'Reports stay in the pre-sign-in queue. Sign in online, then attach them to your account.' : 'Supabase is not configured, so online submission is unavailable.'}</span></div>
                  <button type="button" disabled={!isOnline || !isSupabaseActive} onClick={() => setIsAuthOpen(true)}><LogIn size={14} /> Sign in</button>
                </div>
              )}
            </form>

            <div className="offline-emergency__queue">
              <div className="offline-emergency__queue-heading">
                <div><h3>Report queue</h3><p>{pendingCount} awaiting confirmation · {submittedCount} submitted</p></div>
                <button type="button" onClick={() => void syncReports(true)} disabled={!isOnline || !user || isSyncing || pendingCount === 0}>
                  <RefreshCw size={14} className={isSyncing ? 'offline-emergency__spin' : undefined} /> Retry
                </button>
              </div>

              {user && unclaimedCount > 0 && (
                <div className="offline-emergency__unclaimed" role="status">
                  <LockKeyhole size={17} />
                  <div>
                    <strong>{unclaimedCount} pre-sign-in {unclaimedCount === 1 ? 'report' : 'reports'} on this device</strong>
                    <span>These are hidden from account queues and have not been submitted. Attach only reports you created.</span>
                  </div>
                  <button type="button" onClick={() => void handleClaimReports()} disabled={isClaiming}>
                    {isClaiming ? 'Attaching…' : 'Attach to my account'}
                  </button>
                </div>
              )}

              {reports.length === 0 ? (
                <div className="offline-emergency__queue-empty">
                  <HardDrive size={25} />
                  <strong>{user ? 'No reports for this account' : 'No pre-sign-in reports'}</strong>
                  <span>{user ? 'Reports attached to this account will appear here with their confirmation status.' : 'Reports saved before sign-in stay separate from account queues.'}</span>
                </div>
              ) : (
                <div className="offline-emergency__queue-list">
                  {reports.map((report) => <ReportCard key={report.id} report={report} onRemove={handleRemoveReport} />)}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="offline-emergency__footer">
          <div><ShieldCheck size={18} /><p><strong>Keep preparing.</strong> Review your household or campus emergency plan while this guide is open.</p></div>
          <Link to="/guide">Open emergency guide <span aria-hidden="true">→</span></Link>
        </footer>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccessLogin={() => undefined} />
    </div>
  );
}
