export const NAGPUR = {
  latitude: 21.1458,
  longitude: 79.0882,
};

export type RadarFrame = {
  time: number;
  path: string;
};

export type RadarData = {
  host: string;
  generated: number | null;
  frames: RadarFrame[];
};

export type WeatherData = {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
  };
  current_units: {
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation: string;
    wind_speed_10m: string;
  };
  hourly_units: {
    precipitation: string;
    precipitation_probability: string;
  };
};

export type CachedData<T> = {
  data: T;
  fetchedAt: string;
};

type WeatherCoordinates = {
  latitude: number;
  longitude: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isRadarData(value: unknown): value is RadarData {
  if (!isRecord(value) || typeof value.host !== 'string' || !Array.isArray(value.frames)) return false;
  try {
    if (new URL(value.host).protocol !== 'https:') return false;
  } catch {
    return false;
  }
  return (
    (value.generated === null || isFiniteNumber(value.generated)) &&
    value.frames.every(
      (frame) =>
        isRecord(frame) &&
        isFiniteNumber(frame.time) &&
        typeof frame.path === 'string' &&
        /^\/v2\/radar\/[\w-]+$/.test(frame.path),
    )
  );
}

export function isWeatherData(value: unknown): value is WeatherData {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.hourly)) return false;
  const current = value.current;
  const hourly = value.hourly;
  return (
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    typeof current.time === 'string' &&
    isFiniteNumber(current.temperature_2m) &&
    isFiniteNumber(current.relative_humidity_2m) &&
    isFiniteNumber(current.precipitation) &&
    isFiniteNumber(current.rain) &&
    isFiniteNumber(current.wind_speed_10m) &&
    Array.isArray(hourly.time) &&
    Array.isArray(hourly.precipitation) &&
    Array.isArray(hourly.precipitation_probability) &&
    hourly.time.length > 0 &&
    hourly.time.length === hourly.precipitation.length &&
    hourly.time.length === hourly.precipitation_probability.length &&
    hourly.time.every((time) => typeof time === 'string') &&
    hourly.precipitation.every(isFiniteNumber) &&
    hourly.precipitation_probability.every(isFiniteNumber) &&
    isRecord(value.current_units) &&
    isRecord(value.hourly_units)
  );
}

export async function fetchRadarData(signal?: AbortSignal): Promise<RadarData> {
  const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal });
  if (!response.ok) throw new Error(`RainViewer returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload.host !== 'string' || !isRecord(payload.radar)) {
    throw new Error('RainViewer returned an unexpected response.');
  }

  const host = payload.host;
  const radarHost = new URL(host);
  if (radarHost.protocol !== 'https:' || !Array.isArray(payload.radar.past)) {
    throw new Error('RainViewer did not provide a supported radar feed.');
  }

  const frames = payload.radar.past
    .filter(
      (frame): frame is Record<string, unknown> =>
        isRecord(frame) &&
        isFiniteNumber(frame.time) &&
        typeof frame.path === 'string' &&
        /^\/v2\/radar\/[\w-]+$/.test(frame.path),
    )
    .map((frame) => ({ time: frame.time as number, path: frame.path as string }))
    .sort((left, right) => left.time - right.time);

  if (!frames.length) throw new Error('RainViewer has no past radar frames available.');
  return {
    host: radarHost.origin,
    generated: isFiniteNumber(payload.generated) ? payload.generated : null,
    frames,
  };
}

export async function fetchWeatherData(
  coordinates: WeatherCoordinates,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m',
    hourly: 'precipitation,precipitation_probability',
    forecast_days: '2',
    timezone: 'Asia/Kolkata',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isWeatherData(payload)) throw new Error('Open-Meteo returned incomplete weather data.');
  return payload;
}
