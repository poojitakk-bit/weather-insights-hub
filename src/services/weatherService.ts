import type { RainfallPoint } from "@/lib/flood/types";

/**
 * Thin client for the Open-Meteo forecast API (https://open-meteo.com).
 * No API key required. All values returned by this module are real
 * forecast/observation values from Open-Meteo — nothing here is simulated.
 */

const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const HOURLY_FIELDS = [
  "precipitation",
  "rain",
  "precipitation_probability",
  "temperature_2m",
  "relative_humidity_2m",
  "surface_pressure",
  "wind_speed_10m",
  "wind_gusts_10m",
  "cloud_cover",
  "weather_code",
  "runoff",
] as const;

export interface OpenMeteoHourly {
  time: string[];
  precipitation: number[];
  rain?: number[];
  precipitation_probability: number[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  surface_pressure?: number[];
  wind_speed_10m: number[];
  wind_gusts_10m?: number[];
  cloud_cover?: number[];
  weather_code?: number[];
  runoff?: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  hourly: OpenMeteoHourly;
}

export interface CurrentWeatherSnapshot {
  time: string;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  precipitationMm: number;
  precipitationProbabilityPct: number;
  windGustsKmh: number | null;
  surfacePressureHpa: number | null;
  cloudCoverPct: number | null;
  weatherCode: number | null;
}

export interface RainfallMetrics {
  /** Accumulated rainfall over the available past window (up to 24 h before now). */
  past24hMm: number;
  next1hMm: number;
  next3hMm: number;
  next6hMm: number;
  next12hMm: number;
  next24hMm: number;
  /** Cumulative rainfall over the whole forecast window that was fetched. */
  cumulativeForecastMm: number;
  maxHourlyMm: number;
  maxProbabilityPct: number;
  /** Total forecast surface runoff over the next 24 h, when Open-Meteo provides it. */
  runoff24hMm: number | null;
  /** Comparison of the next 6 h against the following 6 h. */
  intensityTrend: "rising" | "steady" | "falling";
  forecastHours: number;
}

export interface LocationWeather {
  latitude: number;
  longitude: number;
  elevationM: number | null;
  timezone: string;
  source: "Open-Meteo";
  fetchedAt: string;
  current: CurrentWeatherSnapshot;
  metrics: RainfallMetrics;
  /** Hourly precipitation timeline starting at the current hour, shaped for RainfallTimeline. */
  timeline: RainfallPoint[];
}

/** Fetch raw hourly forecast data for a lat/lng from Open-Meteo (24 h past + 48 h forecast). */
export async function fetchHourlyWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<OpenMeteoResponse> {
  const url = new URL(OPEN_METEO_ENDPOINT);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("past_hours", "24");
  url.searchParams.set("forecast_hours", "48");
  url.searchParams.set("timezone", "Asia/Kolkata");

  let res: Response;
  try {
    // Built conditionally: with `exactOptionalPropertyTypes`, RequestInit.signal cannot be
    // explicitly set to `undefined` — it must be omitted entirely when there's no AbortSignal.
    const init: RequestInit = signal ? { signal } : {};
    res = await fetch(url.toString(), init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error("Could not reach the Open-Meteo weather service. Check your connection.");
  }

  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as Partial<OpenMeteoResponse>;
  if (!data.hourly || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
    throw new Error("Open-Meteo returned no hourly forecast for this location.");
  }
  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    throw new Error("Open-Meteo response was missing coordinates.");
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    ...(typeof data.elevation === "number" ? { elevation: data.elevation } : {}),
    timezone: data.timezone ?? "Asia/Kolkata",
    hourly: data.hourly,
  };
}

/** "YYYY-MM-DDTHH:00" for the current hour in Asia/Kolkata, matching Open-Meteo's hourly.time format. */
function nowIstHourKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:00`;
}

/** Index of the current (or next available) hour within the hourly arrays. */
export function findCurrentHourIndex(hourly: OpenMeteoHourly): number {
  const key = nowIstHourKey();
  const idx = hourly.time.findIndex((t) => t >= key);
  return idx === -1 ? 0 : idx;
}

export function currentWeatherSnapshot(
  hourly: OpenMeteoHourly,
  index: number,
): CurrentWeatherSnapshot | null {
  const time = hourly.time[index];
  const temperatureC = hourly.temperature_2m[index];
  const humidityPct = hourly.relative_humidity_2m[index];
  const windSpeedKmh = hourly.wind_speed_10m[index];
  const precipitationMm = hourly.precipitation[index];
  const precipitationProbabilityPct = hourly.precipitation_probability[index];

  if (
    time === undefined ||
    temperatureC === undefined ||
    humidityPct === undefined ||
    windSpeedKmh === undefined ||
    precipitationMm === undefined ||
    precipitationProbabilityPct === undefined
  ) {
    return null;
  }

  return {
    time,
    temperatureC,
    humidityPct,
    windSpeedKmh,
    precipitationMm,
    precipitationProbabilityPct,
    windGustsKmh: hourly.wind_gusts_10m?.[index] ?? null,
    surfacePressureHpa: hourly.surface_pressure?.[index] ?? null,
    cloudCoverPct: hourly.cloud_cover?.[index] ?? null,
    weatherCode: hourly.weather_code?.[index] ?? null,
  };
}

function sum(values: (number | undefined)[]): number {
  return Number(values.reduce<number>((acc, v) => acc + (v ?? 0), 0).toFixed(1));
}

function window(arr: number[] | undefined, from: number, hours: number): (number | undefined)[] {
  if (!arr) return [];
  return arr.slice(Math.max(0, from), Math.max(0, from) + hours);
}

/** Derives every rainfall aggregate the dashboard shows from the raw hourly arrays. */
export function computeRainfallMetrics(
  hourly: OpenMeteoHourly,
  startIndex: number,
): RainfallMetrics {
  const precip = hourly.precipitation;
  const forecast = precip.slice(startIndex);
  const past = precip.slice(Math.max(0, startIndex - 24), startIndex);

  const next6 = sum(window(precip, startIndex, 6));
  const following6 = sum(window(precip, startIndex + 6, 6));
  const trend: RainfallMetrics["intensityTrend"] =
    following6 > next6 * 1.2 + 0.5 ? "rising" : following6 < next6 * 0.8 - 0.5 ? "falling" : "steady";

  const probs = hourly.precipitation_probability.slice(startIndex, startIndex + 24);
  const runoffWindow = hourly.runoff ? window(hourly.runoff, startIndex, 24) : null;

  return {
    past24hMm: sum(past),
    next1hMm: sum(window(precip, startIndex, 1)),
    next3hMm: sum(window(precip, startIndex, 3)),
    next6hMm: next6,
    next12hMm: sum(window(precip, startIndex, 12)),
    next24hMm: sum(window(precip, startIndex, 24)),
    cumulativeForecastMm: sum(forecast),
    maxHourlyMm: Number(Math.max(0, ...forecast.slice(0, 48)).toFixed(1)),
    maxProbabilityPct: probs.length ? Math.round(Math.max(0, ...probs)) : 0,
    runoff24hMm: runoffWindow && runoffWindow.length ? sum(runoffWindow) : null,
    intensityTrend: trend,
    forecastHours: forecast.length,
  };
}

/**
 * Maps Open-Meteo hourly precipitation into the app's existing RainfallPoint
 * shape (used by RainfallTimeline) so the real chart component can be reused
 * unmodified. There is no ensemble in the real data, so lowMm/highMm are set
 * equal to the actual value rather than inventing an uncertainty band.
 */
export function toRainfallTimeline(
  hourly: OpenMeteoHourly,
  startIndex: number,
  hours = 27,
): RainfallPoint[] {
  const points: RainfallPoint[] = [];
  const end = Math.min(hourly.time.length, startIndex + hours);
  for (let i = startIndex; i < end; i++) {
    const time = hourly.time[i];
    const precip = hourly.precipitation[i];
    if (time === undefined || precip === undefined) continue;
    const value = Number(precip.toFixed(1));
    points.push({
      hour: i - startIndex,
      label: time.slice(11, 16),
      rainfallMm: value,
      lowMm: value,
      highMm: value,
    });
  }
  return points;
}

/** Fetches and shapes everything a selected location needs from Open-Meteo. */
export async function getLocationWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<LocationWeather> {
  const data = await fetchHourlyWeather(lat, lng, signal);
  const startIndex = findCurrentHourIndex(data.hourly);
  const current = currentWeatherSnapshot(data.hourly, startIndex);
  if (!current) {
    throw new Error("Open-Meteo returned incomplete hourly data for this location.");
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    elevationM: typeof data.elevation === "number" ? data.elevation : null,
    timezone: data.timezone,
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
    current,
    metrics: computeRainfallMetrics(data.hourly, startIndex),
    timeline: toRainfallTimeline(data.hourly, startIndex),
  };
}
