import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CloudRain,
  CloudSun,
  Droplets,
  ExternalLink,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Wind,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { LiveMonitoringMap } from './LiveMonitoringMap';
import {
  fetchRadarData,
  fetchWeatherData,
  isRadarData,
  isWeatherData,
  NAGPUR,
  type CachedData,
  type RadarData,
  type WeatherData,
} from '../lib/services/liveMonitoringService';
import './LiveMonitoringPage.css';

const RADAR_REFRESH_MS = 5 * 60 * 1000;
const WEATHER_REFRESH_MS = 60 * 60 * 1000;
const RADAR_CACHE_KEY = 'disasteriq_live_monitoring_radar_v1';
const WEATHER_CACHE_KEY = 'disasteriq_live_monitoring_weather_v1';

type FeedStatus = 'loading' | 'ready' | 'stale' | 'error';

type Place = {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
};

function readCache<T>(
  key: string,
  validator: (value: unknown) => value is T,
): CachedData<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('data' in value) ||
      !('fetchedAt' in value) ||
      typeof value.fetchedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.fetchedAt)) ||
      !validator(value.data)
    ) {
      return null;
    }
    return { data: value.data, fetchedAt: value.fetchedAt };
  } catch (error) {
    console.warn(`Could not read cached monitoring data (${key}).`, error);
    return null;
  }
}

function getWeatherCacheKey(latitude: number, longitude: number) {
  return `${WEATHER_CACHE_KEY}_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
}

function storeCache<T>(key: string, value: CachedData<T>) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save monitoring cache (${key}).`, error);
  }
}

function formatDateTime(value: string | number, options?: Intl.DateTimeFormatOptions) {
  const date =
    typeof value === 'string' && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)
      ? new Date(`${value}+05:30`)
      : new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Timestamp unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(options ?? {}),
  }).format(date);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  detail: string;
}) {
  return (
    <div className="weather-metric">
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-reading">
        <strong>{value}</strong>
        {unit && <span>{unit}</span>}
      </div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

export function LiveMonitoringPage() {
  const [radarCache, setRadarCache] = useState(() => readCache(RADAR_CACHE_KEY, isRadarData));
  const [weatherCache, setWeatherCache] = useState(() =>
    readCache(getWeatherCacheKey(NAGPUR.latitude, NAGPUR.longitude), isWeatherData),
  );
  const radarRef = useRef<CachedData<RadarData> | null>(radarCache);
  const weatherRef = useRef<CachedData<WeatherData> | null>(weatherCache);
  const weatherCacheKeyRef = useRef(getWeatherCacheKey(NAGPUR.latitude, NAGPUR.longitude));
  const [radarStatus, setRadarStatus] = useState<FeedStatus>(radarCache ? 'stale' : 'loading');
  const [weatherStatus, setWeatherStatus] = useState<FeedStatus>(weatherCache ? 'stale' : 'loading');
  const [radarError, setRadarError] = useState('');
  const [weatherError, setWeatherError] = useState('');
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(
    radarCache ? radarCache.data.frames.length - 1 : -1,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const updateRadarCache = useCallback((value: CachedData<RadarData> | null) => {
    radarRef.current = value;
    setRadarCache(value);
  }, []);

  const updateWeatherCache = useCallback((value: CachedData<WeatherData> | null) => {
    weatherRef.current = value;
    setWeatherCache(value);
  }, []);

  const refreshRadar = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchRadarData(signal);
      const cached = { data, fetchedAt: new Date().toISOString() };
      if (!radarRef.current) setSelectedFrameIndex(data.frames.length - 1);
      updateRadarCache(cached);
      storeCache(RADAR_CACHE_KEY, cached);
      setRadarStatus('ready');
      setRadarError('');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setRadarStatus(radarRef.current ? 'stale' : 'error');
      setRadarError(getErrorMessage(error, 'RainViewer radar is unavailable.'));
    }
  }, [updateRadarCache]);

  const coordinates = useMemo(
    () => ({
      latitude: selectedPlace?.latitude ?? NAGPUR.latitude,
      longitude: selectedPlace?.longitude ?? NAGPUR.longitude,
    }),
    [selectedPlace],
  );

  const refreshWeather = useCallback(async (signal?: AbortSignal) => {
    const cacheKey = getWeatherCacheKey(coordinates.latitude, coordinates.longitude);
    if (weatherCacheKeyRef.current !== cacheKey) {
      const locationCache = readCache(cacheKey, isWeatherData);
      weatherCacheKeyRef.current = cacheKey;
      updateWeatherCache(locationCache);
    }
    const locationCache = weatherCacheKeyRef.current === cacheKey ? weatherRef.current : null;
    try {
      const data = await fetchWeatherData(coordinates, signal);
      const cached = { data, fetchedAt: new Date().toISOString() };
      updateWeatherCache(cached);
      storeCache(cacheKey, cached);
      setWeatherStatus('ready');
      setWeatherError('');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setWeatherStatus(locationCache ? 'stale' : 'error');
      setWeatherError(getErrorMessage(error, 'Open-Meteo weather data is unavailable.'));
    }
  }, [coordinates, updateWeatherCache]);

  useEffect(() => {
    const controller = new AbortController();
    const initialRequest = window.setTimeout(() => void refreshRadar(controller.signal), 0);
    const interval = window.setInterval(() => void refreshRadar(controller.signal), RADAR_REFRESH_MS);
    return () => {
      controller.abort();
      window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [refreshRadar]);

  useEffect(() => {
    const controller = new AbortController();
    const initialRequest = window.setTimeout(() => void refreshWeather(controller.signal), 0);
    const interval = window.setInterval(() => void refreshWeather(controller.signal), WEATHER_REFRESH_MS);
    return () => {
      controller.abort();
      window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [refreshWeather]);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const radar = radarCache?.data ?? null;
  const frames = radar?.frames ?? [];
  const selectedFrame =
    frames[Math.min(Math.max(selectedFrameIndex, 0), Math.max(frames.length - 1, 0))] ?? null;

  const weather = weatherCache?.data ?? null;
  const currentHour = weather?.hourly.time.findIndex((time) => time >= weather.current.time.slice(0, 13)) ?? -1;
  const precipitationProbability =
    currentHour >= 0 ? weather?.hourly.precipitation_probability[currentHour] : null;
  const forecast = weather
    ? weather.hourly.time
        .map((time, index) => ({
          time,
          precipitation: weather.hourly.precipitation[index],
          probability: weather.hourly.precipitation_probability[index],
        }))
        .filter((hour) => hour.time >= weather.current.time)
        .slice(0, 12)
    : [];
  const mostRecentUpdate = [weatherCache?.fetchedAt, radarCache?.fetchedAt]
    .filter((time): time is string => Boolean(time))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
  const hasStaleFeed = radarStatus === 'stale' || weatherStatus === 'stale';
  const isConnected = isOnline && radarStatus === 'ready' && weatherStatus === 'ready';
  const updateIndicatorState = !isOnline
    ? 'is-offline'
    : isConnected
      ? 'is-current'
      : hasStaleFeed
        ? 'is-stale'
        : 'is-pending';

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshRadar(), refreshWeather()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const changeFrame = useCallback((index: number) => {
    setSelectedFrameIndex(index);
  }, []);

  const handlePlaceSelected = useCallback((place: Place | null) => {
    setSelectedPlace(place);
    setWeatherStatus('loading');
    setWeatherError('');
  }, []);

  return (
    <div className="live-monitoring-page">
      <div className="monitoring-ambient" aria-hidden="true" />
      <div className="monitoring-shell">
        <header className="monitoring-header">
          <div>
            <div className="monitoring-kicker"><Activity size={14} /> DISASTERIQ · LIVE INTELLIGENCE</div>
            <h1>Nagpur <span>Live Monitoring</span></h1>
            <p className="monitoring-subtitle">Rain radar, modelled weather, and verified data availability for Nagpur, Maharashtra.</p>
          </div>
          <div className="monitoring-header-actions">
            <div className={`connection-indicator ${isOnline ? (isConnected ? 'is-connected' : 'is-partial') : 'is-offline'}`}>
              <span />
              <div>
                <strong>{!isOnline ? 'Offline' : isConnected ? 'Feeds connected' : 'Partial availability'}</strong>
                <small>{hasStaleFeed ? 'Some feed data is stale' : 'Provider health checked on refresh'}</small>
              </div>
            </div>
            <button type="button" className="monitoring-refresh" onClick={refreshAll} disabled={isRefreshing}>
              <RefreshCw size={15} className={isRefreshing ? 'is-spinning' : ''} />
              <span>{isRefreshing ? 'Refreshing' : 'Refresh data'}</span>
            </button>
          </div>
        </header>

        <div className="monitoring-updated">
          <span className={`update-pulse ${updateIndicatorState}`} />
          {mostRecentUpdate
            ? <>Last successful update <strong>{formatDateTime(mostRecentUpdate)}</strong></>
            : 'Waiting for first live provider response'}
          {weatherCache && (
            <span className="feed-timestamp">Weather feed · {formatDateTime(weatherCache.fetchedAt)}</span>
          )}
          {radarCache && (
            <span className="feed-timestamp">Radar feed · {formatDateTime(radarCache.fetchedAt)}</span>
          )}
        </div>

        <main className="monitoring-main-grid">
          <section className="monitoring-map-section" aria-label="Interactive Nagpur weather map">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">LIVE MAP · NAGPUR, INDIA</span>
                <h2>Rainfall intelligence</h2>
              </div>
              <div className="map-heading-meta"><MapPin size={14} /> 21.1458° N · 79.0882° E</div>
            </div>
            <LiveMonitoringMap
              radar={radar}
              selectedFrame={selectedFrame}
              selectedFrameIndex={selectedFrameIndex}
              onFrameChange={changeFrame}
              onPlaceSelected={handlePlaceSelected}
            />
            <div className="map-source-line">
              <span>Base map © OpenStreetMap contributors</span>
              <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">Weather data by RainViewer <ExternalLink size={12} /></a>
            </div>
          </section>

          <aside className="monitoring-side-panel" aria-label="Current Nagpur weather and data status">
            <section className="side-panel-card current-weather-card">
              <div className="panel-heading compact">
                <div>
                  <span className="section-eyebrow">OPEN-METEO · WEATHER MODEL</span>
                  <h2>Current conditions</h2>
                </div>
                <CloudSun className="panel-heading-icon" size={18} />
              </div>
              {weather ? (
                <>
                  <p className="weather-location"><MapPin size={13} /> {selectedPlace?.name ?? 'Nagpur city center'}</p>
                  <p className="weather-observation-label">
                    Model grid {formatNumber(weather.latitude, 3)}° N, {formatNumber(weather.longitude, 3)}° E
                    {' · '}{formatDateTime(weather.current.time, { dateStyle: undefined, timeStyle: 'short' })} IST
                  </p>
                  <div className="temperature-reading">
                    <strong>{formatNumber(weather.current.temperature_2m, 1)}°</strong>
                    <span>C</span>
                  </div>
                  <div className="metric-grid">
                    <MetricCard
                      icon={<Droplets size={15} />}
                      label="Precipitation"
                      value={formatNumber(weather.current.precipitation, 1)}
                      unit="mm"
                      detail="Model current interval"
                    />
                    <MetricCard
                      icon={<CloudRain size={15} />}
                      label="Rain chance"
                      value={precipitationProbability === null || precipitationProbability === undefined ? '—' : formatNumber(precipitationProbability)}
                      unit={precipitationProbability === null || precipitationProbability === undefined ? undefined : '%'}
                      detail="Hourly model probability"
                    />
                    <MetricCard
                      icon={<Gauge size={15} />}
                      label="Humidity"
                      value={formatNumber(weather.current.relative_humidity_2m)}
                      unit="%"
                      detail="Relative humidity"
                    />
                    <MetricCard
                      icon={<Wind size={15} />}
                      label="Wind"
                      value={formatNumber(weather.current.wind_speed_10m, 1)}
                      unit="km/h"
                      detail="At 10 m above ground"
                    />
                  </div>
                  <p className="source-timestamp">Open-Meteo update · {formatDateTime(weatherCache?.fetchedAt ?? '')}</p>
                </>
              ) : (
                <div className="feed-message">
                  <AlertTriangle size={17} />
                  <span>{weatherStatus === 'loading' ? 'Loading weather model data…' : weatherError || 'Weather model data is unavailable.'}</span>
                </div>
              )}
              {weatherError && weather && <p className="stale-note">{weatherError} Showing the last successful response.</p>}
            </section>

            <section className="side-panel-card data-status-card">
              <div className="panel-heading compact">
                <div>
                  <span className="section-eyebrow">OFFICIAL SOURCES</span>
                  <h2>Warnings &amp; local data</h2>
                </div>
                <ShieldAlert className="panel-heading-icon" size={18} />
              </div>
              <div className="data-availability-row">
                <span className="availability-icon unavailable"><AlertTriangle size={14} /></span>
                <div><strong>IMD district warnings</strong><small>Not available in this dashboard</small></div>
                <a href="https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php" target="_blank" rel="noreferrer" aria-label="Open official IMD district warnings"><ExternalLink size={14} /></a>
              </div>
              <div className="data-availability-row">
                <span className="availability-icon unavailable"><MapPin size={14} /></span>
                <div><strong>Flood / waterlogging reports</strong><small>No verified local feed available</small></div>
              </div>
              <p className="data-limitation">
                IMD's published warning, nowcast, and district rainfall feeds are not CORS-accessible to this app. No warning is inferred or generated here.
                Use the <a href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">official IMD portal</a> for current advisories.
              </p>
            </section>
          </aside>
        </main>

        <section className="monitoring-bottom-grid">
          <div className="forecast-panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">OPEN-METEO · MODEL FORECAST</span>
                <h2>Next 12 hours</h2>
              </div>
              <span className="forecast-unit">Precipitation · mm/h</span>
            </div>
            {forecast.length ? (
              <>
                <div className="rain-chart" role="img" aria-label="Hourly precipitation forecast from Open-Meteo">
                  {forecast.map((hour, index) => {
                    const maxRain = Math.max(...forecast.map((item) => item.precipitation), 1);
                    const barHeight = Math.max((hour.precipitation / maxRain) * 100, hour.precipitation > 0 ? 8 : 2);
                    return (
                      <div className="rain-chart-column" key={hour.time} title={`${formatDateTime(hour.time, { dateStyle: undefined, timeStyle: 'short' })}: ${formatNumber(hour.precipitation, 1)} mm; ${formatNumber(hour.probability)}% probability`}>
                        <span className="chart-probability">{index % 2 === 0 ? `${formatNumber(hour.probability)}%` : ''}</span>
                        <div className="chart-bar-track"><span style={{ height: `${barHeight}%` }} className={hour.precipitation > 0 ? 'chart-bar has-rain' : 'chart-bar'} /></div>
                        <span className="chart-rain-value">{hour.precipitation > 0 ? formatNumber(hour.precipitation, 1) : '·'}</span>
                        <span className="chart-hour">{formatDateTime(hour.time, { dateStyle: undefined, timeStyle: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="chart-legend">
                  <span><i className="legend-rain" /> Forecast precipitation (mm)</span>
                  <span><i className="legend-probability" /> Probability (%) above selected hours</span>
                </div>
              </>
            ) : (
              <div className="empty-forecast"><CloudRain size={18} /> {weatherError || 'Hourly forecast is currently unavailable.'}</div>
            )}
            {weather && <p className="forecast-footnote">Forecast at {selectedPlace ? `${selectedPlace.name} coordinates` : 'Nagpur city center'} · model output, not an observation. Data timestamp: {formatDateTime(weatherCache?.fetchedAt ?? '')}.</p>}
          </div>

          <div className="radar-status-panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">RAINVIEWER · OBSERVED RADAR</span>
                <h2>Recent coverage</h2>
              </div>
              <Thermometer className="panel-heading-icon" size={18} />
            </div>
            {radar ? (
              <>
                <div className="radar-frame-count"><strong>{radar.frames.length}</strong><span>available past frames</span></div>
                <div className="radar-time-window">
                  <span>{formatDateTime(radar.frames[0].time)}</span>
                  <span className="window-track"><i /></span>
                  <span>{formatDateTime(radar.frames.at(-1)!.time)}</span>
                </div>
                <p className="radar-status-copy">Composite radar reflectivity · frame timestamps shown in IST. Radar returns no future nowcast frames.</p>
                <p className="source-timestamp">
                  Feed generated · {radar.generated === null ? 'Timestamp unavailable' : formatDateTime(radar.generated * 1000)}
                </p>
                {radarError && <p className="stale-note">{radarError} Showing the last successful response.</p>}
              </>
            ) : (
              <div className="feed-message">
                <AlertTriangle size={17} />
                <span>{radarStatus === 'loading' ? 'Loading radar frames…' : radarError || 'RainViewer radar is unavailable.'}</span>
              </div>
            )}
            <div className="risk-disclaimer">
              <ShieldAlert size={15} />
              <p>No flood-risk estimate is shown: verified local elevation, drainage, and incident data are not connected. Rainfall forecasts are not flood warnings.</p>
            </div>
          </div>
        </section>

        <footer className="monitoring-footnote">
          <span><Activity size={13} /> Situational awareness only · Not an official flood-warning system</span>
          <div>
            <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo <ExternalLink size={11} /></a>
            <a href="https://www.rainviewer.com/api/weather-maps-api.html" target="_blank" rel="noreferrer">RainViewer API <ExternalLink size={11} /></a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LiveMonitoringPage;
