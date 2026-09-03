/**
 * Transparent flood-risk indicator.
 *
 * This is NOT a hydrological model and it is not machine learning: it is a
 * documented, deterministic 0-100 blend of the real signals we actually
 * fetched (Open-Meteo rainfall/runoff/probability, NASA POWER satellite
 * precipitation, terrain elevation). Every driver reports the raw value it
 * was computed from, so the UI can show exactly why the number is what it is.
 */

import type { RainfallMetrics } from "@/services/weatherService";
import type { SatellitePrecipitation } from "@/services/satelliteService";

export type FloodRiskLevel = "low" | "moderate" | "high" | "severe";

export interface RiskDriver {
  id: string;
  label: string;
  /** Points contributed to the 0-100 score (already weighted). */
  points: number;
  /** Maximum points this driver can contribute. */
  maxPoints: number;
  /** Human-readable raw value behind the contribution. */
  detail: string;
  source: string;
  available: boolean;
}

export interface FloodRiskIndicator {
  score: number;
  level: FloodRiskLevel;
  drivers: RiskDriver[];
  /** 0-100: how much of the indicator's inputs were actually available. */
  coveragePct: number;
  method: string;
}

/** Linear ramp from 0 at `zero` to `max` points at `full`. */
function ramp(value: number, zero: number, full: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= zero) return 0;
  if (value >= full) return max;
  return ((value - zero) / (full - zero)) * max;
}

export function levelFor(score: number): FloodRiskLevel {
  if (score >= 75) return "severe";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

export function computeFloodRisk(input: {
  metrics: RainfallMetrics | null;
  satellite: SatellitePrecipitation | null;
  elevationM: number | null;
}): FloodRiskIndicator {
  const { metrics, satellite, elevationM } = input;
  const drivers: RiskDriver[] = [];

  // 1. Forecast rainfall next 24 h — IMD heavy-rain thresholds (64.5 / 115.6 / 204.5 mm).
  const next24 = metrics?.next24hMm ?? null;
  drivers.push({
    id: "forecast-24h",
    label: "Forecast rainfall (next 24 h)",
    points: next24 === null ? 0 : ramp(next24, 5, 204.5, 32),
    maxPoints: 32,
    detail: next24 === null ? "Forecast unavailable" : `${next24.toFixed(1)} mm forecast`,
    source: "Open-Meteo",
    available: next24 !== null,
  });

  // 2. Short-burst intensity next 6 h — flash-flood driver.
  const next6 = metrics?.next6hMm ?? null;
  drivers.push({
    id: "burst-6h",
    label: "Short-burst intensity (next 6 h)",
    points: next6 === null ? 0 : ramp(next6, 2, 80, 20),
    maxPoints: 20,
    detail: next6 === null ? "Forecast unavailable" : `${next6.toFixed(1)} mm in 6 h`,
    source: "Open-Meteo",
    available: next6 !== null,
  });

  // 3. Antecedent wetness — rain already fallen in the past 24 h saturates soil.
  const past24 = metrics?.past24hMm ?? null;
  drivers.push({
    id: "antecedent",
    label: "Antecedent rainfall (past 24 h)",
    points: past24 === null ? 0 : ramp(past24, 2, 120, 14),
    maxPoints: 14,
    detail: past24 === null ? "Past window unavailable" : `${past24.toFixed(1)} mm already fallen`,
    source: "Open-Meteo",
    available: past24 !== null,
  });

  // 4. Modelled surface runoff — direct hydrological signal when provided.
  const runoff = metrics?.runoff24hMm ?? null;
  drivers.push({
    id: "runoff",
    label: "Modelled surface runoff (24 h)",
    points: runoff === null ? 0 : ramp(runoff, 0.5, 40, 14),
    maxPoints: 14,
    detail: runoff === null ? "Runoff not provided for this point" : `${runoff.toFixed(1)} mm runoff`,
    source: "Open-Meteo",
    available: runoff !== null,
  });

  // 5. Satellite-observed rainfall — independent confirmation (lagged).
  const sat = satellite?.last24hMm ?? null;
  drivers.push({
    id: "satellite",
    label: "Satellite-observed rainfall",
    points: sat === null ? 0 : ramp(sat, 2, 120, 10),
    maxPoints: 10,
    detail:
      sat === null
        ? "Satellite source unavailable"
        : `${sat.toFixed(1)} mm over last published 24 h (${satellite!.latencyHours} h lag)`,
    source: "NASA POWER",
    available: sat !== null,
  });

  // 6. Terrain exposure — low-lying points drain slowly.
  drivers.push({
    id: "elevation",
    label: "Terrain exposure (elevation)",
    points: elevationM === null ? 0 : ramp(60 - elevationM, 0, 60, 10),
    maxPoints: 10,
    detail: elevationM === null ? "Elevation unavailable" : `${Math.round(elevationM)} m above sea level`,
    source: "Open-Meteo / NASA POWER",
    available: elevationM !== null,
  });

  const rawScore = drivers.reduce((acc, d) => acc + d.points, 0);
  const availableMax = drivers.reduce((acc, d) => acc + (d.available ? d.maxPoints : 0), 0);
  const totalMax = drivers.reduce((acc, d) => acc + d.maxPoints, 0);

  // Rescale to the drivers we actually have, so a missing feed lowers confidence
  // (coverage) rather than silently deflating the score.
  const score = availableMax > 0 ? Math.round((rawScore / availableMax) * 100) : 0;

  return {
    score: Math.max(0, Math.min(100, score)),
    level: levelFor(score),
    drivers: drivers.map((d) => ({ ...d, points: Number(d.points.toFixed(1)) })),
    coveragePct: Math.round((availableMax / totalMax) * 100),
    method:
      "Weighted blend of live rainfall, short-burst intensity, antecedent rain, modelled runoff, satellite rainfall and elevation. Rescaled to the sources available. Not a calibrated hydrological model.",
  };
}

/**
 * Agreement between the two independent rainfall observations we have
 * (forecast/analysis vs. satellite). Low agreement means treat with caution.
 */
export function sourceAgreement(
  forecastPast24Mm: number | null,
  satellitePast24Mm: number | null,
): { level: "agree" | "partial" | "diverge" | "unknown"; detail: string } {
  if (forecastPast24Mm === null || satellitePast24Mm === null) {
    return { level: "unknown", detail: "Only one rainfall source is available." };
  }
  const diff = Math.abs(forecastPast24Mm - satellitePast24Mm);
  const scale = Math.max(1, (forecastPast24Mm + satellitePast24Mm) / 2);
  const ratio = diff / scale;
  const detail = `Open-Meteo ${forecastPast24Mm.toFixed(1)} mm vs NASA POWER ${satellitePast24Mm.toFixed(1)} mm (different windows: POWER lags by days).`;
  if (ratio <= 0.35) return { level: "agree", detail };
  if (ratio <= 0.8) return { level: "partial", detail };
  return { level: "diverge", detail };
}
