/**
 * Central pipeline for "everything we know about a point on the map".
 *
 * Every source is fetched with Promise.allSettled so one failing feed never
 * blocks the others — each source reports its own availability and error.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { getLocationWeather, type LocationWeather } from "@/services/weatherService";
import { getSatellitePrecipitation, type SatellitePrecipitation } from "@/services/satelliteService";
import { getRadarComposite, type RadarComposite } from "@/services/radarService";
import {
  computeFloodRisk,
  sourceAgreement,
  type FloodRiskIndicator,
} from "@/services/floodRiskService";

export interface SourceStatus {
  id: "open-meteo" | "nasa-power" | "rainviewer";
  name: string;
  ok: boolean;
  error: string | null;
  /** Human-readable freshness for the source, when known. */
  freshness: string | null;
}

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  weather: LocationWeather | null;
  satellite: SatellitePrecipitation | null;
  radar: RadarComposite | null;
  risk: FloodRiskIndicator;
  agreement: ReturnType<typeof sourceAgreement>;
  sources: SourceStatus[];
  loadedAt: number;
}

function reason(r: PromiseSettledResult<unknown>): string | null {
  if (r.status === "fulfilled") return null;
  const e = r.reason as unknown;
  return e instanceof Error ? e.message : "Unknown error";
}

export async function loadLocationData(
  lat: number,
  lng: number,
  name: string,
  signal?: AbortSignal,
): Promise<LocationData> {
  const [weatherR, satelliteR, radarR] = await Promise.allSettled([
    getLocationWeather(lat, lng, signal),
    getSatellitePrecipitation(lat, lng, signal),
    getRadarComposite(signal),
  ]);

  const weather = weatherR.status === "fulfilled" ? weatherR.value : null;
  const satellite = satelliteR.status === "fulfilled" ? satelliteR.value : null;
  const radar = radarR.status === "fulfilled" ? radarR.value : null;

  const elevationM = weather?.elevationM ?? satellite?.elevationM ?? null;

  const risk = computeFloodRisk({
    metrics: weather?.metrics ?? null,
    satellite,
    elevationM,
  });

  const sources: SourceStatus[] = [
    {
      id: "open-meteo",
      name: "Open-Meteo forecast",
      ok: weather !== null,
      error: reason(weatherR),
      freshness: weather ? `Hour ${weather.current.time.slice(11, 16)} IST` : null,
    },
    {
      id: "nasa-power",
      name: "NASA POWER satellite rainfall",
      ok: satellite !== null,
      error: reason(satelliteR),
      freshness: satellite ? `${satellite.latencyHours} h behind real time` : null,
    },
    {
      id: "rainviewer",
      name: "RainViewer radar composite",
      ok: radar !== null,
      error: reason(radarR),
      freshness: radar ? `${radar.latencyMinutes} min old` : null,
    },
  ];

  return {
    name,
    lat,
    lng,
    weather,
    satellite,
    radar,
    risk,
    agreement: sourceAgreement(weather?.metrics.past24hMm ?? null, satellite?.last24hMm ?? null),
    sources,
    loadedAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, LocationData>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export type LocationDataStatus = "idle" | "loading" | "ready" | "error";

export interface UseLocationData {
  status: LocationDataStatus;
  data: LocationData | null;
  error: string | null;
  /** True while refreshing over previously loaded (still displayed) data. */
  stale: boolean;
  select: (lat: number, lng: number, name: string) => void;
  refresh: () => void;
  clear: () => void;
}

export function useLocationData(): UseLocationData {
  const [status, setStatus] = useState<LocationDataStatus>("idle");
  const [data, setData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const lastRef = useRef<{ lat: number; lng: number; name: string } | null>(null);

  const run = useCallback((lat: number, lng: number, name: string, useCache: boolean) => {
    lastRef.current = { lat, lng, name };
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestRef.current;

    const key = cacheKey(lat, lng);
    const cached = cache.get(key);
    if (useCache && cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      setData({ ...cached, name });
      setStatus("ready");
      setError(null);
      setStale(false);
      return;
    }

    setStale(cached != null);
    if (cached) setData({ ...cached, name });
    setStatus("loading");
    setError(null);

    loadLocationData(lat, lng, name, controller.signal)
      .then((result) => {
        if (requestRef.current !== id) return;
        cache.set(key, result);
        setData(result);
        setStale(false);
        if (result.sources.every((s) => !s.ok)) {
          setStatus("error");
          setError("All live data sources failed for this location.");
        } else {
          setStatus("ready");
        }
      })
      .catch((err: unknown) => {
        if (requestRef.current !== id) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStale(false);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Could not load live data.");
      });
  }, []);

  const select = useCallback(
    (lat: number, lng: number, name: string) => run(lat, lng, name, true),
    [run],
  );

  const refresh = useCallback(() => {
    const last = lastRef.current;
    if (last) run(last.lat, last.lng, last.name, false);
  }, [run]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    requestRef.current++;
    lastRef.current = null;
    setData(null);
    setStatus("idle");
    setError(null);
    setStale(false);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, data, error, stale, select, refresh, clear };
}
