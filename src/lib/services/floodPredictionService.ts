import { NAGPUR } from './liveMonitoringService';

export type FloodCoordinates = {
  latitude: number;
  longitude: number;
};

export type FloodWeather = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    precipitation: number;
    rain: number;
  };
  current_units: Record<string, string>;
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
  };
  hourly_units: Record<string, string>;
};

export type RainArchive = {
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
  daily_units: Record<string, string>;
};

export type FloodAssessmentInput = FloodCoordinates & {
  current_rain_mm: number | null;
  observed_24h_rain_mm: number | null;
  forecast_24h_rain_mm: number | null;
  elevation_m: number | null;
};

export type FloodAssessment = {
  risk_category: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Unavailable';
  status: 'preliminary';
  model_status: 'not_trained';
  evaluation_metrics: null;
  prediction_window: string;
  basis: string;
  factors: string[];
  generated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber);
}

function validateFloodWeather(value: unknown): value is FloodWeather {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.hourly)) return false;
  const { current, hourly } = value;
  return (
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    typeof value.timezone === 'string' &&
    typeof current.time === 'string' &&
    isFiniteNumber(current.precipitation) &&
    isFiniteNumber(current.rain) &&
    isRecord(value.current_units) &&
    isStringArray(hourly.time) &&
    isNumberArray(hourly.precipitation) &&
    isNumberArray(hourly.precipitation_probability) &&
    hourly.time.length > 0 &&
    hourly.time.length === hourly.precipitation.length &&
    hourly.time.length === hourly.precipitation_probability.length &&
    isRecord(value.hourly_units)
  );
}

function validateRainArchive(value: unknown): value is RainArchive {
  if (!isRecord(value) || !isRecord(value.daily) || !isRecord(value.daily_units)) return false;
  const { daily } = value;
  return (
    isStringArray(daily.time) &&
    isNumberArray(daily.precipitation_sum) &&
    daily.time.length > 0 &&
    daily.time.length === daily.precipitation_sum.length
  );
}

function validateFloodAssessment(value: unknown): value is FloodAssessment {
  return (
    isRecord(value) &&
    ['Low', 'Moderate', 'High', 'Severe', 'Unavailable'].includes(String(value.risk_category)) &&
    value.status === 'preliminary' &&
    value.model_status === 'not_trained' &&
    value.evaluation_metrics === null &&
    typeof value.prediction_window === 'string' &&
    typeof value.basis === 'string' &&
    Array.isArray(value.factors) &&
    value.factors.every((factor) => typeof factor === 'string') &&
    typeof value.generated_at === 'string'
  );
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Data provider returned HTTP ${response.status}.`);
  return response.json();
}

function coordinatesQuery(coordinates: FloodCoordinates) {
  return new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    timezone: 'Asia/Kolkata',
  });
}

export async function fetchFloodWeather(
  coordinates: FloodCoordinates = NAGPUR,
  signal?: AbortSignal,
): Promise<FloodWeather> {
  const query = coordinatesQuery(coordinates);
  query.set('current', 'precipitation,rain');
  query.set('hourly', 'precipitation,precipitation_probability');
  query.set('past_days', '2');
  query.set('forecast_days', '2');
  const data = await getJson(`https://api.open-meteo.com/v1/forecast?${query}`, signal);
  if (!validateFloodWeather(data)) throw new Error('Open-Meteo returned incomplete rainfall forecast data.');
  return data;
}

export async function fetchRainArchive(
  coordinates: FloodCoordinates = NAGPUR,
  signal?: AbortSignal,
): Promise<RainArchive> {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateValues = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const endDate = new Date(Date.UTC(
    Number(dateValues.year),
    Number(dateValues.month) - 1,
    Number(dateValues.day) - 1,
  ));
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const query = coordinatesQuery(coordinates);
  query.set('start_date', formatDate(startDate));
  query.set('end_date', formatDate(endDate));
  query.set('daily', 'precipitation_sum');
  const data = await getJson(`https://archive-api.open-meteo.com/v1/archive?${query}`, signal);
  if (!validateRainArchive(data)) throw new Error('Open-Meteo archive returned incomplete daily rainfall data.');
  return data;
}

export async function fetchElevation(
  coordinates: FloodCoordinates,
  signal?: AbortSignal,
): Promise<number> {
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });
  const data = await getJson(`https://api.open-meteo.com/v1/elevation?${query}`, signal);
  if (!isRecord(data) || !Array.isArray(data.elevation) || !isFiniteNumber(data.elevation[0])) {
    throw new Error('Open-Meteo returned incomplete elevation data.');
  }
  return data.elevation[0];
}

const apiBase = (import.meta.env.VITE_FLOOD_API_URL ?? '/api').replace(/\/$/, '');

export async function requestFloodAssessment(
  input: FloodAssessmentInput,
  signal?: AbortSignal,
): Promise<FloodAssessment> {
  const response = await fetch(`${apiBase}/prediction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Flood assessment API returned HTTP ${response.status}.`);
  }
  const data: unknown = await response.json();
  if (!validateFloodAssessment(data)) {
    throw new Error('Flood assessment API returned an unexpected response.');
  }
  return data;
}
