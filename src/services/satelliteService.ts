/**
 * NASA POWER hourly point data (https://power.larc.nasa.gov).
 * No API key required, browser-callable (CORS enabled).
 *
 * POWER's hourly PRECTOTCORR is a satellite/reanalysis-derived precipitation
 * product (MERRA-2 / IMERG lineage). It is NOT real time: values typically lag
 * by a few days, so every reading is returned with its own timestamp and an
 * explicit latency so the UI can label it honestly.
 */

const POWER_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/hourly/point";

export interface SatellitePrecipitation {
  source: "NASA POWER (satellite-derived)";
  /** Precipitation for the most recent hour POWER has published, in mm/h. */
  latestPrecipMmPerHour: number;
  /** Sum over the last 24 published hours, in mm. */
  last24hMm: number;
  /** ISO timestamp (UTC) of the most recent published hour. */
  observedAt: string;
  /** How far behind "now" the most recent published hour is. */
  latencyHours: number;
  /** POWER's terrain elevation for the point, in metres (null when absent). */
  elevationM: number | null;
  latitude: number;
  longitude: number;
  fetchedAt: string;
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Parses POWER's "YYYYMMDDHH" key into an ISO UTC timestamp. */
function keyToIso(key: string): string | null {
  if (!/^\d{10}$/.test(key)) return null;
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(4, 6));
  const d = Number(key.slice(6, 8));
  const h = Number(key.slice(8, 10));
  return new Date(Date.UTC(y, m - 1, d, h)).toISOString();
}

export async function getSatellitePrecipitation(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<SatellitePrecipitation> {
  const end = new Date();
  const start = new Date(end.getTime() - 10 * 24 * 3600 * 1000);

  const url = new URL(POWER_ENDPOINT);
  url.searchParams.set("parameters", "PRECTOTCORR");
  url.searchParams.set("community", "AG");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set("start", ymd(start));
  url.searchParams.set("end", ymd(end));
  url.searchParams.set("format", "JSON");
  url.searchParams.set("time-standard", "UTC");

  let res: Response;
  try {
    const init: RequestInit = signal ? { signal } : {};
    res = await fetch(url.toString(), init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error("Could not reach NASA POWER satellite precipitation service.");
  }

  if (!res.ok) throw new Error(`NASA POWER request failed (HTTP ${res.status}).`);

  const data = (await res.json()) as {
    properties?: { parameter?: { PRECTOTCORR?: Record<string, number> } };
    geometry?: { coordinates?: number[] };
  };

  const series = data.properties?.parameter?.PRECTOTCORR;
  if (!series || Object.keys(series).length === 0) {
    throw new Error("NASA POWER returned no precipitation values for this point.");
  }

  // POWER uses -999 as its fill value for missing hours.
  const entries = Object.entries(series)
    .filter(([, v]) => typeof v === "number" && v > -900)
    .sort(([a], [b]) => (a < b ? -1 : 1));

  if (entries.length === 0) {
    throw new Error("NASA POWER has not published usable hours for this point yet.");
  }

  const last = entries[entries.length - 1]!;
  const observedAt = keyToIso(last[0]);
  if (!observedAt) throw new Error("NASA POWER returned an unrecognised timestamp.");

  const last24 = entries.slice(-24).reduce((acc, [, v]) => acc + v, 0);
  const coords = data.geometry?.coordinates;
  const elevation = coords && coords.length > 2 ? (coords[2] as number) : null;

  return {
    source: "NASA POWER (satellite-derived)",
    latestPrecipMmPerHour: Number(last[1].toFixed(2)),
    last24hMm: Number(last24.toFixed(1)),
    observedAt,
    latencyHours: Math.max(
      0,
      Math.round((Date.now() - new Date(observedAt).getTime()) / 3600000),
    ),
    elevationM: typeof elevation === "number" ? Number(elevation.toFixed(0)) : null,
    latitude: lat,
    longitude: lng,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * NASA GIBS tile templates. GIBS REST tiles use {z}/{y}/{x} order — note the
 * y/x swap compared with the usual XYZ convention Leaflet expects, which is
 * why the templates below are written explicitly.
 */
export const GIBS_ATTRIBUTION =
  '&copy; <a href="https://earthdata.nasa.gov/gibs">NASA EOSDIS GIBS</a>';

/** VIIRS true-colour imagery for a given UTC date (defaults to yesterday, the newest complete pass). */
export function gibsTrueColorUrl(date?: string): string {
  const d = date ?? gibsDefaultDate();
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${d}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
}

/** IMERG 30-minute precipitation rate tiles for a given UTC date. */
export function gibsImergUrl(date?: string): string {
  const d = date ?? gibsDefaultDate();
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate_30min/default/${d}T00:00:00Z/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
}

/** GIBS publishes with a delay; yesterday (UTC) is the safest complete day. */
export function gibsDefaultDate(): string {
  const d = new Date(Date.now() - 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
