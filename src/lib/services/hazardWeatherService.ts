import { NAGPUR } from './liveMonitoringService';

type WeatherUnits = Record<string, string>;

export type HazardWeather = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: Record<string, string | number>;
  current_units: WeatherUnits;
  hourly: Record<string, Array<string | number>>;
  hourly_units: WeatherUnits;
  daily: Record<string, Array<string | number>>;
  daily_units: WeatherUnits;
};

export type RainHistory = {
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
  daily_units: WeatherUnits;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumberSeries(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

function isStringSeries(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isHazardWeather(value: unknown): value is HazardWeather {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.hourly) || !isRecord(value.daily)) return false;
  return (
    typeof value.timezone === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    isRecord(value.current_units) &&
    isRecord(value.hourly_units) &&
    isRecord(value.daily_units) &&
    Object.values(value.current).every((item) => typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item))) &&
    Object.values(value.hourly).every((item) => isNumberSeries(item) || isStringSeries(item)) &&
    Object.values(value.daily).every((item) => isNumberSeries(item) || isStringSeries(item))
  );
}

export function isRainHistory(value: unknown): value is RainHistory {
  if (!isRecord(value) || !isRecord(value.daily) || !isRecord(value.daily_units)) return false;
  return (
    isStringSeries(value.daily.time) &&
    isNumberSeries(value.daily.precipitation_sum) &&
    value.daily.time.length > 0 &&
    value.daily.time.length === value.daily.precipitation_sum.length
  );
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}.`);
  return response.json();
}

export async function fetchHazardWeather(signal?: AbortSignal): Promise<HazardWeather> {
  const query = new URLSearchParams({
    latitude: String(NAGPUR.latitude),
    longitude: String(NAGPUR.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'weather_code',
    ].join(','),
    hourly: [
      'precipitation',
      'precipitation_probability',
      'temperature_2m',
      'apparent_temperature',
      'wind_speed_10m',
      'wind_direction_10m',
      'relative_humidity_2m',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
    ].join(','),
    forecast_days: '7',
    timezone: 'Asia/Kolkata',
  });
  const data = await getJson(`https://api.open-meteo.com/v1/forecast?${query}`, signal);
  if (!isHazardWeather(data)) throw new Error('Open-Meteo returned incomplete hazard weather data.');
  return data;
}

export async function fetchRainHistory(signal?: AbortSignal): Promise<RainHistory> {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 6);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const toDate = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  const query = new URLSearchParams({
    latitude: String(NAGPUR.latitude),
    longitude: String(NAGPUR.longitude),
    start_date: toDate(startDate),
    end_date: toDate(endDate),
    daily: 'precipitation_sum',
    timezone: 'Asia/Kolkata',
  });
  const data = await getJson(`https://archive-api.open-meteo.com/v1/archive?${query}`, signal);
  if (!isRainHistory(data)) throw new Error('Open-Meteo archive returned incomplete rainfall history.');
  return data;
}
