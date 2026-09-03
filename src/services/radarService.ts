/**
 * RainViewer public radar composite (https://www.rainviewer.com/api.html).
 * No API key required. weather-maps.json returns the frame index; each frame
 * has a path used to build the tile template.
 */

const RAINVIEWER_INDEX = "https://api.rainviewer.com/public/weather-maps.json";

export interface RadarFrame {
  /** Unix seconds for the frame. */
  time: number;
  /** Path fragment used to build the tile URL. */
  path: string;
  kind: "past" | "nowcast";
}

export interface RadarComposite {
  source: "RainViewer";
  host: string;
  frames: RadarFrame[];
  /** The most recent observed (non-forecast) frame. */
  latest: RadarFrame;
  latestIso: string;
  latencyMinutes: number;
  fetchedAt: string;
}

interface RainViewerIndex {
  host?: string;
  radar?: {
    past?: { time: number; path: string }[];
    nowcast?: { time: number; path: string }[];
  };
}

export async function getRadarComposite(signal?: AbortSignal): Promise<RadarComposite> {
  let res: Response;
  try {
    const init: RequestInit = signal ? { signal } : {};
    res = await fetch(RAINVIEWER_INDEX, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error("Radar data unavailable — could not reach RainViewer.");
  }

  if (!res.ok) throw new Error(`Radar data unavailable (RainViewer HTTP ${res.status}).`);

  const data = (await res.json()) as RainViewerIndex;
  const past = data.radar?.past ?? [];
  const nowcast = data.radar?.nowcast ?? [];
  if (!data.host || past.length === 0) {
    throw new Error("Radar data unavailable — RainViewer returned no frames.");
  }

  const frames: RadarFrame[] = [
    ...past.map((f) => ({ time: f.time, path: f.path, kind: "past" as const })),
    ...nowcast.map((f) => ({ time: f.time, path: f.path, kind: "nowcast" as const })),
  ];

  const latest = past[past.length - 1]!;
  const latestIso = new Date(latest.time * 1000).toISOString();

  return {
    source: "RainViewer",
    host: data.host,
    frames,
    latest: { time: latest.time, path: latest.path, kind: "past" },
    latestIso,
    latencyMinutes: Math.max(0, Math.round((Date.now() - latest.time * 1000) / 60000)),
    fetchedAt: new Date().toISOString(),
  };
}

/** Builds a Leaflet-compatible tile URL template for a radar frame. */
export function radarTileUrl(
  composite: RadarComposite,
  frame: RadarFrame = composite.latest,
  options?: { colorScheme?: number; smooth?: boolean; snow?: boolean },
): string {
  const color = options?.colorScheme ?? 4;
  const smooth = options?.smooth === false ? 0 : 1;
  const snow = options?.snow === false ? 0 : 1;
  return `${composite.host}${frame.path}/256/{z}/{x}/{y}/${color}/${smooth}_${snow}.png`;
}

export const RAINVIEWER_ATTRIBUTION =
  '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>';
