import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Activity,
  CloudRain,
  Droplets,
  ExternalLink,
  RefreshCw,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  fetchHazardWeather,
  fetchRainHistory,
  type HazardWeather,
  type RainHistory,
} from '../lib/services/hazardWeatherService';
import './WeatherHazardModulePage.css';

type HazardKind = 'flood' | 'heat' | 'storm';

const moduleByPath: Record<string, HazardKind> = {
  '/flood-prediction': 'flood',
  '/heatwave-monitoring': 'heat',
  '/storm-monitoring': 'storm',
};

const moduleContent = {
  flood: {
    title: 'Nagpur Flood & Rainfall Intelligence',
    eyebrow: 'FLOOD MONITORING',
    summary: 'Observed radar and modelled precipitation are shown separately. Rainfall forecasts are not flood predictions.',
  },
  heat: {
    title: 'Nagpur Heatwave Monitoring',
    eyebrow: 'HEAT MONITORING',
    summary: 'Model-derived temperatures and apparent temperature with daily outlook. Official heat warnings are not connected.',
  },
  storm: {
    title: 'Nagpur Storm & Wind Monitoring',
    eyebrow: 'SEVERE WEATHER',
    summary: 'Model-derived wind, gusts, and precipitation for situational awareness. No unverified lightning markers or warnings.',
  },
} satisfies Record<HazardKind, { title: string; eyebrow: string; summary: string }>;

function formatNumber(value: number | undefined, digits = 1) {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
}

function formatTime(value: string) {
  const date = new Date(`${value}+05:30`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function numberValue(values: Record<string, Array<string | number>>, key: string, index: number) {
  const value = values[key]?.[index];
  return typeof value === 'number' ? value : undefined;
}

function textValue(values: Record<string, Array<string | number>>, key: string, index: number) {
  const value = values[key]?.[index];
  return typeof value === 'string' ? value : '';
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="hazard-metric">
      <span className="hazard-metric__icon">{icon}</span>
      <span className="hazard-metric__label">{label}</span>
      <strong>{value}<small>{unit}</small></strong>
    </div>
  );
}

export function WeatherHazardModulePage() {
  const { pathname } = useLocation();
  const kind = moduleByPath[pathname];
  const [weather, setWeather] = useState<HazardWeather | null>(null);
  const [history, setHistory] = useState<RainHistory | null>(null);
  const [weatherError, setWeatherError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setWeatherError('');
      setHistoryError('');
      const tasks: Promise<void>[] = [
        fetchHazardWeather(controller.signal)
          .then((data) => {
            setWeather(data);
            setUpdatedAt(new Date().toISOString());
          })
          .catch((error: unknown) => {
            if (error instanceof Error && error.name === 'AbortError') return;
            setWeatherError(error instanceof Error ? error.message : 'Weather data is unavailable.');
          }),
      ];
      if (kind === 'flood') {
        tasks.push(
          fetchRainHistory(controller.signal)
            .then(setHistory)
            .catch((error: unknown) => {
              if (error instanceof Error && error.name === 'AbortError') return;
              setHistoryError(error instanceof Error ? error.message : 'Historical rainfall is unavailable.');
            }),
        );
      }
      await Promise.all(tasks);
      if (!controller.signal.aborted) setIsLoading(false);
    };
    void load();
    return () => controller.abort();
  }, [kind, refreshVersion]);

  if (!kind) return null;

  const content = moduleContent[kind];
  const current = weather?.current ?? {};
  const currentNumber = (key: string) => typeof current[key] === 'number' ? current[key] as number : undefined;

  return (
    <main className="hazard-module">
      <div className="hazard-module__shell">
        <header className="hazard-header">
          <div>
            <div className="hazard-eyebrow">{content.eyebrow} · NAGPUR, MAHARASHTRA</div>
            <h1>{content.title}</h1>
            <p>{content.summary}</p>
          </div>
          <button
            type="button"
            className="hazard-refresh"
            onClick={() => setRefreshVersion((version) => version + 1)}
            aria-label="Refresh weather data"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        <div className="hazard-meta">
          <span className={weather && !weatherError ? 'hazard-status is-ready' : 'hazard-status'}>
            <i /> {isLoading ? 'Loading provider data' : weather ? 'Open-Meteo connected' : 'Weather unavailable'}
          </span>
          {updatedAt && <span>Last successful update · {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(updatedAt))}</span>}
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo source <ExternalLink size={12} /></a>
        </div>

        {weatherError && <p className="hazard-message" role="status"><AlertTriangle size={15} />{weatherError}{weather ? ' Showing the latest successful data.' : ''}</p>}

        {weather && (
          <section className="hazard-panel">
            <div className="hazard-panel__heading">
              <div><span>WEATHER MODEL · NAGPUR GRID</span><h2>Current conditions</h2></div>
              <small>Model time · {formatTime(String(current.time ?? ''))} IST</small>
            </div>
            <div className="hazard-metrics">
              {kind === 'heat' && (
                <>
                  <Metric icon={<Thermometer size={17} />} label="Air temperature" value={formatNumber(currentNumber('temperature_2m'))} unit={` ${weather.current_units.temperature_2m ?? '°C'}`} />
                  <Metric icon={<Thermometer size={17} />} label="Apparent temperature" value={formatNumber(currentNumber('apparent_temperature'))} unit={` ${weather.current_units.apparent_temperature ?? '°C'}`} />
                  <Metric icon={<Droplets size={17} />} label="Relative humidity" value={formatNumber(currentNumber('relative_humidity_2m'), 0)} unit={` ${weather.current_units.relative_humidity_2m ?? '%'}`} />
                </>
              )}
              {kind === 'flood' && (
                <>
                  <Metric icon={<Droplets size={17} />} label="Current precipitation" value={formatNumber(currentNumber('precipitation'))} unit={` ${weather.current_units.precipitation ?? 'mm'}`} />
                  <Metric icon={<CloudRain size={17} />} label="Rain" value={formatNumber(currentNumber('rain'))} unit={` ${weather.current_units.rain ?? 'mm'}`} />
                  <Metric icon={<Wind size={17} />} label="Wind" value={formatNumber(currentNumber('wind_speed_10m'))} unit={` ${weather.current_units.wind_speed_10m ?? 'km/h'}`} />
                </>
              )}
              {kind === 'storm' && (
                <>
                  <Metric icon={<Wind size={17} />} label="Wind speed" value={formatNumber(currentNumber('wind_speed_10m'))} unit={` ${weather.current_units.wind_speed_10m ?? 'km/h'}`} />
                  <Metric icon={<Wind size={17} />} label="Wind gusts" value={formatNumber(currentNumber('wind_gusts_10m'))} unit={` ${weather.current_units.wind_gusts_10m ?? 'km/h'}`} />
                  <Metric icon={<CloudRain size={17} />} label="Precipitation" value={formatNumber(currentNumber('precipitation'))} unit={` ${weather.current_units.precipitation ?? 'mm'}`} />
                  <Metric icon={<Activity size={17} />} label="Wind direction" value={formatNumber(currentNumber('wind_direction_10m'), 0)} unit={` ${weather.current_units.wind_direction_10m ?? '°'}`} />
                </>
              )}
            </div>
          </section>
        )}

        {kind === 'flood' && (
          <section className="hazard-panel">
            <div className="hazard-panel__heading">
              <div><span>OPEN-METEO ARCHIVE · REANALYSIS</span><h2>Recent daily precipitation</h2></div>
              <small>Historical model data · not a rain-gauge observation</small>
            </div>
            {history ? (
              <div className="hazard-history">
                {history.daily.time.map((day, index) => {
                  const amount = history?.daily.precipitation_sum[index] ?? 0;
                  const maximum = Math.max(...(history?.daily.precipitation_sum ?? [0]), 1);
                  return (
                    <div className="hazard-history__day" key={day} title={`${day}: ${formatNumber(amount)} ${history?.daily_units.precipitation_sum ?? 'mm'}`}>
                      <span>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }).format(new Date(`${day}T12:00:00+05:30`))}</span>
                      <div><i style={{ height: `${Math.max((amount / maximum) * 100, amount > 0 ? 8 : 2)}%` }} /></div>
                      <strong>{formatNumber(amount)}<small> mm</small></strong>
                    </div>
                  );
                })}
              </div>
            ) : <p className="hazard-empty">{historyError || (isLoading ? 'Loading archive data…' : 'Historical rainfall is unavailable.')}</p>}
            <p className="hazard-disclaimer">No locality-level flood prediction is available. Verified terrain, drainage, historical incident data, and an evaluated model are not connected. Rainfall is not flood impact.</p>
          </section>
        )}

        {(kind === 'heat' || kind === 'storm') && weather && (
          <section className="hazard-panel">
            <div className="hazard-panel__heading">
              <div><span>OPEN-METEO · FORECAST</span><h2>Next 12 hours</h2></div>
              <small>Model estimates · hourly resolution</small>
            </div>
            <div className="hazard-hourly">
              {weather.hourly.time
                .map((_, index) => ({ index, time: textValue(weather.hourly, 'time', index) }))
                .filter(({ time }) => time >= String(current.time ?? ''))
                .slice(0, 12)
                .map(({ time, index }) => (
                <div className="hazard-hourly__item" key={time}>
                  <span>{formatTime(time)}</span>
                  {kind === 'heat' ? (
                    <><strong>{formatNumber(numberValue(weather.hourly, 'temperature_2m', index))}°</strong><small>Feels {formatNumber(numberValue(weather.hourly, 'apparent_temperature', index))}°</small></>
                  ) : (
                    <><strong>{formatNumber(numberValue(weather.hourly, 'wind_speed_10m', index))} km/h</strong><small>{formatNumber(numberValue(weather.hourly, 'precipitation', index))} mm · {formatNumber(numberValue(weather.hourly, 'precipitation_probability', index), 0)}% chance</small></>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {kind === 'heat' && weather && (
          <section className="hazard-panel">
            <div className="hazard-panel__heading"><div><span>OPEN-METEO · DAILY FORECAST</span><h2>Temperature outlook</h2></div></div>
            <div className="hazard-daily">
              {weather.daily.time.map((day, index) => (
                <div className="hazard-daily__item" key={day}>
                  <span>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric' }).format(new Date(`${day}T12:00:00+05:30`))}</span>
                  <strong>{formatNumber(numberValue(weather.daily, 'temperature_2m_max', index))}°</strong>
                  <small>Feels like {formatNumber(numberValue(weather.daily, 'apparent_temperature_max', index))}°</small>
                  <span>Low {formatNumber(numberValue(weather.daily, 'temperature_2m_min', index))}°</span>
                </div>
              ))}
            </div>
            <p className="hazard-disclaimer">Forecasts are model-derived, not official heat alerts. For immediate danger call 112. <a href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">Check the IMD portal <ExternalLink size={11} /></a></p>
          </section>
        )}

        {kind === 'storm' && (
          <section className="hazard-panel hazard-limitation">
            <AlertTriangle size={17} />
            <p>No verified lightning strike feed or browser-accessible official warning feed is connected. Wind and rainfall models do not confirm a lightning event or an official warning.</p>
          </section>
        )}

        <nav className="hazard-actions" aria-label="Monitoring actions">
          <Link to="/live-monitoring">Open interactive radar <ArrowRight size={14} /></Link>
          <a href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">Official IMD weather information <ExternalLink size={13} /></a>
        </nav>
      </div>
    </main>
  );
}

export default WeatherHazardModulePage;
