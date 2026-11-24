import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  ExternalLink,
  MapPin,
  RefreshCw,
  Waves,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  fetchElevation,
  fetchFloodWeather,
  fetchRainArchive,
  requestFloodAssessment,
  type FloodAssessment,
  type FloodCoordinates,
  type FloodWeather,
  type RainArchive,
} from '../lib/services/floodPredictionService';
import { NAGPUR } from '../lib/services/liveMonitoringService';
import { FloodPredictionMap } from './FloodPredictionMap';
import './FloodPredictionPage.css';

type RainPoint = {
  time: string;
  amount: number;
  forecast: boolean;
};

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
}

function parseModelTime(value: string) {
  const timestamp = new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}+05:30`,
  ).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function collectRainPoints(weather: FloodWeather | null): RainPoint[] {
  if (!weather) return [];
  const modelTime = parseModelTime(weather.current.time);
  if (modelTime === null) return [];
  const from = modelTime - 24 * 60 * 60 * 1000;
  const to = modelTime + 24 * 60 * 60 * 1000;
  return weather.hourly.time.flatMap((time, index) => {
    const timestamp = parseModelTime(time);
    const amount = weather.hourly.precipitation[index];
    if (timestamp === null || timestamp < from || timestamp > to || !Number.isFinite(amount)) return [];
    return [{ time, amount, forecast: timestamp >= modelTime }];
  });
}

function sumRainWindow(weather: FloodWeather, forecast: boolean): number | null {
  const modelTime = parseModelTime(weather.current.time);
  if (modelTime === null) return null;
  const start = forecast ? modelTime : modelTime - 24 * 60 * 60 * 1000;
  const end = forecast ? modelTime + 24 * 60 * 60 * 1000 : modelTime;
  const values = weather.hourly.time.flatMap((time, index) => {
    const timestamp = parseModelTime(time);
    const amount = weather.hourly.precipitation[index];
    if (timestamp === null || timestamp < start || timestamp > end || !Number.isFinite(amount)) return [];
    return [amount];
  });
  if (values.length < 18) return null;
  return values.reduce((total, amount) => total + amount, 0);
}

function formatDateTime(value: string | number) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Timestamp unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function Metric({
  icon,
  label,
  value,
  unit,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  detail: string;
}) {
  return (
    <article className="flood-metric">
      <span className="flood-metric__icon">{icon}</span>
      <span className="flood-metric__label">{label}</span>
      <strong>{value}<small>{unit}</small></strong>
      <span className="flood-metric__detail">{detail}</span>
    </article>
  );
}

function RainfallTimeline({ points }: { points: RainPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.amount), 1);
  return (
    <div className="flood-rain-chart">
      <div className="flood-rain-chart__bars" role="img" aria-label="Hourly precipitation for the previous 24 hours and next 24-hour forecast">
        {points.map((point) => (
          <span
            className={point.forecast ? 'flood-rain-chart__bar is-forecast' : 'flood-rain-chart__bar'}
            key={point.time}
            style={{ height: `${Math.max((point.amount / maximum) * 100, point.amount > 0 ? 5 : 1)}%` }}
            title={`${formatDateTime(point.time)} · ${formatNumber(point.amount)} mm${point.forecast ? ' · forecast' : ' · past model data'}`}
          />
        ))}
      </div>
      <div className="flood-rain-chart__labels"><span>24h ago</span><strong>Model time · {points.length ? formatDateTime(points[Math.floor(points.length / 2)]?.time ?? '').split(', ').at(-1) : 'unavailable'}</strong><span>+24h</span></div>
      <div className="flood-chart-legend">
        <span><i className="is-observed" /> Past model precipitation</span>
        <span><i className="is-forecast" /> Forecast precipitation</span>
      </div>
    </div>
  );
}

function DailyRainArchive({ archive, error }: { archive: RainArchive | null; error: string }) {
  if (!archive) {
    return <p className="flood-empty">{error || 'Loading historical rainfall archive…'}</p>;
  }
  const maximum = Math.max(...archive.daily.precipitation_sum, 1);
  return (
    <div className="flood-daily-chart">
      {archive.daily.time.map((day, index) => {
        const amount = archive.daily.precipitation_sum[index];
        return (
          <div className="flood-daily-chart__day" key={day} title={`${day}: ${formatNumber(amount)} ${archive.daily_units.precipitation_sum ?? 'mm'}`}>
            <span>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }).format(new Date(`${day}T12:00:00+05:30`))}</span>
            <div><i style={{ height: `${Math.max((amount / maximum) * 100, amount > 0 ? 7 : 2)}%` }} /></div>
            <strong>{formatNumber(amount)}<small> mm</small></strong>
          </div>
        );
      })}
    </div>
  );
}

function RiskSummary({ assessment, error, loading }: { assessment: FloodAssessment | null; error: string; loading: boolean }) {
  const category = assessment?.risk_category ?? 'Unavailable';
  const style = category.toLowerCase();
  return (
    <section className={`flood-risk-card risk-${style}`} aria-live="polite">
      <div className="flood-risk-card__topline">
        <span><Waves size={15} /> PRELIMINARY RAINFALL SCREENING</span>
        <span className="flood-risk-card__status"><i /> {loading ? 'Assessing' : assessment ? 'Backend connected' : 'Assessment unavailable'}</span>
      </div>
      <div className="flood-risk-card__body">
        <div>
          <span className="flood-risk-card__label">Rainfall-based category</span>
          <strong className="flood-risk-card__value">{loading ? '…' : category}</strong>
          <span className="flood-risk-card__window">{assessment?.prediction_window ?? 'Current conditions through the next 24 hours'}</span>
        </div>
        <div className="flood-risk-card__flag">
          <AlertTriangle size={18} />
          <span>Not an official flood warning or calibrated flood probability</span>
        </div>
      </div>
      {assessment && (
        <>
          <p className="flood-risk-card__basis">{assessment.basis}</p>
          <ul className="flood-factor-list">
            {assessment.factors.map((factor) => <li key={factor}>{factor}</li>)}
          </ul>
          <div className="flood-model-status">
            <span>ML model · not trained</span>
            <span>Evaluation metrics · unavailable</span>
          </div>
        </>
      )}
      {error && <p className="flood-inline-error" role="status">{error} Start the FastAPI backend to enable the preliminary assessment.</p>}
    </section>
  );
}

export default function FloodPredictionPage() {
  const [coordinates, setCoordinates] = useState<FloodCoordinates>(NAGPUR);
  const [weather, setWeather] = useState<FloodWeather | null>(null);
  const [archive, setArchive] = useState<RainArchive | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<FloodAssessment | null>(null);
  const [weatherError, setWeatherError] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [elevationError, setElevationError] = useState('');
  const [assessmentError, setAssessmentError] = useState('');
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState('');
  const [archiveUpdatedAt, setArchiveUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setIsAssessing(true);
      setWeather(null);
      setArchive(null);
      setElevation(null);
      setAssessment(null);
      setWeatherError('');
      setArchiveError('');
      setElevationError('');
      setAssessmentError('');

      const [weatherResult, archiveResult, elevationResult] = await Promise.allSettled([
        fetchFloodWeather(coordinates, controller.signal),
        fetchRainArchive(coordinates, controller.signal),
        fetchElevation(coordinates, controller.signal),
      ]);
      if (controller.signal.aborted) return;

      let nextWeather: FloodWeather | null = null;
      let nextElevation: number | null = null;
      if (weatherResult.status === 'fulfilled') {
        nextWeather = weatherResult.value;
        setWeather(nextWeather);
        setWeatherUpdatedAt(new Date().toISOString());
      } else {
        setWeatherError(weatherResult.reason instanceof Error ? weatherResult.reason.message : 'Open-Meteo forecast data is unavailable.');
      }
      if (archiveResult.status === 'fulfilled') {
        setArchive(archiveResult.value);
        setArchiveUpdatedAt(new Date().toISOString());
      } else {
        setArchiveError(archiveResult.reason instanceof Error ? archiveResult.reason.message : 'Historical rainfall data is unavailable.');
      }
      if (elevationResult.status === 'fulfilled') {
        nextElevation = elevationResult.value;
        setElevation(nextElevation);
      } else {
        setElevationError(elevationResult.reason instanceof Error ? elevationResult.reason.message : 'Elevation data is unavailable.');
      }
      setIsLoading(false);

      if (nextWeather) {
        try {
          const result = await requestFloodAssessment({
            ...coordinates,
            current_rain_mm: nextWeather.current.precipitation,
            observed_24h_rain_mm: sumRainWindow(nextWeather, false),
            forecast_24h_rain_mm: sumRainWindow(nextWeather, true),
            elevation_m: nextElevation,
          }, controller.signal);
          if (!controller.signal.aborted) setAssessment(result);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          if (!controller.signal.aborted) {
            setAssessmentError(error instanceof Error ? error.message : 'Flood assessment API is unavailable.');
          }
        } finally {
          if (!controller.signal.aborted) setIsAssessing(false);
        }
      } else {
        setAssessmentError('Rainfall input is unavailable; no category was inferred.');
        setIsAssessing(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [coordinates, refreshVersion]);

  const currentRain = weather?.current.precipitation ?? null;
  const observed24h = useMemo(() => weather ? sumRainWindow(weather, false) : null, [weather]);
  const forecast24h = useMemo(() => weather ? sumRainWindow(weather, true) : null, [weather]);
  const rainPoints = useMemo(() => collectRainPoints(weather), [weather]);
  const selectedLocation = `${coordinates.latitude.toFixed(4)}° N, ${coordinates.longitude.toFixed(4)}° E`;

  return (
    <main className="flood-page">
      <div className="flood-shell">
        <header className="flood-header">
          <div>
            <div className="flood-eyebrow"><span /> URBAN FLOOD INTELLIGENCE · NAGPUR, MAHARASHTRA</div>
            <h1>Rainfall &amp; flood<br /><span>risk screening</span></h1>
            <p>Live model rainfall, recent accumulation, forecast and terrain context for a selected Nagpur map point. No locality-level flood labels or calibrated flood model are available.</p>
          </div>
          <button type="button" className="flood-refresh" onClick={() => setRefreshVersion((version) => version + 1)} disabled={isLoading} aria-label="Refresh rainfall, terrain and assessment data">
            <RefreshCw size={15} className={isLoading ? 'is-spinning' : ''} /> Refresh data
          </button>
        </header>

        <div className="flood-data-meta">
          <span className={weather && !weatherError ? 'is-connected' : ''}><i /> {isLoading ? 'Loading weather feeds' : weather ? 'Open-Meteo forecast connected' : 'Forecast unavailable'}</span>
          {weatherUpdatedAt && <span>Forecast fetched · {formatDateTime(weatherUpdatedAt)}</span>}
          {weather?.current.time && <span>Model time · {formatDateTime(weather.current.time)}</span>}
          <span className="flood-meta-location"><MapPin size={12} /> {selectedLocation}</span>
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Weather source <ExternalLink size={12} /></a>
        </div>

        {weatherError && <p className="flood-error" role="status"><AlertTriangle size={15} />{weatherError}</p>}

        <section className="flood-dashboard-grid">
          <section className="flood-map-panel" aria-label="Nagpur flood assessment map">
            <div className="flood-panel-heading">
              <div><span>SELECT A MAP POINT</span><h2>Nagpur urban area</h2></div>
              <small>Click the map to inspect available point data</small>
            </div>
            <FloodPredictionMap coordinates={coordinates} elevation={elevation} onSelect={setCoordinates} />
            <div className="flood-map-footer">
              <span><i className="is-selected" /> Selected point</span>
              <span><i className="is-no-data" /> Local flood vulnerability · unavailable</span>
              <span>Map © OpenStreetMap contributors</span>
            </div>
            <div className="flood-category-legend" aria-label="Rainfall screening categories">
              {(['Low', 'Moderate', 'High', 'Severe'] as const).map((category) => <span className={`category-${category.toLowerCase()}`} key={category}><i />{category}</span>)}
              <small>24h rainfall bands: &lt;15.6 · 15.6–64.4 · 64.5–115.5 · ≥115.6 mm; no affected-area polygons</small>
            </div>
          </section>

          <aside className="flood-side-panel">
            <RiskSummary assessment={assessment} error={assessmentError} loading={isAssessing} />
            <section className="flood-point-card">
              <div className="flood-panel-heading"><div><span>AVAILABLE POINT DATA</span><h2>Selected location</h2></div></div>
              <p className="flood-point-coordinates"><MapPin size={14} /> {selectedLocation}</p>
              <div className="flood-point-detail">
                <span>Terrain elevation</span>
                <strong>{elevation === null ? '—' : `${formatNumber(elevation, 0)} m`}</strong>
                <small>{elevationError || 'Open-Meteo Elevation API · Copernicus GLO-90 · approx. 90 m resolution'}</small>
              </div>
              <p className="flood-point-note">Elevation is contextual only. No local drainage, slope, waterlogging, or verified flood-history layer is connected.</p>
            </section>
          </aside>
        </section>

        <section className="flood-metrics-grid" aria-label="Rainfall and terrain indicators">
          <Metric icon={<Droplets size={16} />} label="Current precipitation" value={formatNumber(currentRain)} unit=" mm" detail={weather ? `Model time ${formatDateTime(weather.current.time)}` : weatherError || 'Waiting for forecast'} />
          <Metric icon={<CloudRain size={16} />} label="Observed accumulation" value={formatNumber(observed24h)} unit=" mm / 24h" detail="Previous 24h · forecast model hourly series" />
          <Metric icon={<CloudRain size={16} />} label="Forecast accumulation" value={formatNumber(forecast24h)} unit=" mm / 24h" detail="Next 24h · hourly model forecast" />
          <Metric icon={<Waves size={16} />} label="Terrain elevation" value={formatNumber(elevation, 0)} unit=" m" detail={elevationError || 'Copernicus GLO-90 terrain model'} />
        </section>

        <section className="flood-panel flood-rainfall-panel">
          <div className="flood-panel-heading">
            <div><span>OPEN-METEO FORECAST API · PAST 2 DAYS + FORECAST</span><h2>Hourly rainfall timeline</h2></div>
            <small>Model precipitation · {weather?.hourly_units.precipitation ?? 'mm'}</small>
          </div>
          {rainPoints.length ? <RainfallTimeline points={rainPoints} /> : <p className="flood-empty">{weatherError || (isLoading ? 'Loading hourly rainfall…' : 'Hourly rainfall is unavailable.')}</p>}
          <p className="flood-footnote">Past hourly values are model data, not rain-gauge observations. Forecast values are estimates, not measured rainfall.</p>
        </section>

        <section className="flood-panel flood-archive-panel">
          <div className="flood-panel-heading">
            <div><span>OPEN-METEO HISTORICAL ARCHIVE API</span><h2>Previous 7 complete days</h2></div>
            <small>{archiveUpdatedAt ? `Archive fetched · ${formatDateTime(archiveUpdatedAt)}` : 'Daily gridded archive · not a local gauge'}</small>
          </div>
          <DailyRainArchive archive={archive} error={archiveError} />
          <p className="flood-footnote">Historical gridded precipitation, not an IMD station observation. {archiveError && `Archive unavailable: ${archiveError}`}</p>
        </section>

        <section className="flood-data-limit">
          <AlertTriangle size={17} />
          <div>
            <strong>What this screen does—and does not—predict</strong>
            <p>The backend currently applies an explicitly preliminary rainfall-only screening rule. Flood labels, geocoded waterlogging incidents, calibrated terrain/drainage data, and an evaluated ML model are not connected; therefore no trained-model metrics or locality-level risk claims are shown. Risk categories are not official warnings.</p>
            <div className="flood-source-links">
              <a href="https://mausam.imd.gov.in/responsive/rainfallinformation.php" target="_blank" rel="noreferrer">IMD rainfall information <ExternalLink size={12} /></a>
              <a href="https://bhuvan-app1.nrsc.gov.in/thematic/thematic/index.php" target="_blank" rel="noreferrer">NRSC Bhuvan thematic services <ExternalLink size={12} /></a>
              <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">Elevation methodology <ExternalLink size={12} /></a>
            </div>
          </div>
        </section>
        <p className="flood-source-stamp">Assessment generated · {assessment ? formatDateTime(assessment.generated_at) : 'Unavailable'} · Weather source timestamps shown per feed · No incident database attached</p>
      </div>
    </main>
  );
}
