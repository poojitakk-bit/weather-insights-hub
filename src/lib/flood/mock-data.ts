import type {
  CitizenReport,
  DataSource,
  FloodLocation,
  InundationCell,
  RainfallPoint,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  Scenario,
  ScenarioId,
} from "./types";

export const DISCLAIMER =
  "This is a research prototype and not an official emergency warning system. Verify alerts with official authorities.";

export const LOCATIONS: FloodLocation[] = [
  {
    id: "mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    population: "20.4M",
    terrain: "Coastal reclaimed land, tide-locked stormwater outfalls",
  },
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    population: "8.4M",
    terrain: "Sabarmati floodplain, flat urban drainage",
  },
  {
    id: "chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    population: "11.5M",
    terrain: "Low-gradient coastal plain, encroached lake network",
  },
  {
    id: "guwahati",
    city: "Guwahati",
    state: "Assam",
    lat: 26.1445,
    lng: 91.7362,
    population: "1.2M",
    terrain: "Brahmaputra valley, hill runoff into urban basins",
  },
  {
    id: "patna",
    city: "Patna",
    state: "Bihar",
    lat: 25.5941,
    lng: 85.1376,
    population: "2.5M",
    terrain: "Ganga–Punpun confluence, embankment dependent",
  },
  {
    id: "kochi",
    city: "Kochi",
    state: "Kerala",
    lat: 9.9312,
    lng: 76.2673,
    population: "2.1M",
    terrain: "Backwater islands, near sea-level canals",
  },
  {
    id: "bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    population: "13.6M",
    terrain: "Plateau valley drains, tank cascade overflow",
  },
  {
    id: "kolkata",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    population: "15.1M",
    terrain: "Hooghly deltaic flats, pumped drainage",
  },
  {
    id: "delhi",
    city: "Delhi",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    population: "32.9M",
    terrain: "Yamuna floodplain, high impervious cover",
  },
  {
    id: "srinagar",
    city: "Srinagar",
    state: "Jammu and Kashmir",
    lat: 34.0837,
    lng: 74.7973,
    population: "1.8M",
    terrain: "Jhelum basin bowl, snowmelt plus rainfall",
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: "normal",
    name: "Normal week",
    description: "Baseline pre/post-monsoon conditions with isolated showers.",
    intensity: 0.45,
  },
  {
    id: "monsoon",
    name: "Active monsoon",
    description: "Broad monsoon surge with sustained moderate-to-heavy rainfall.",
    intensity: 1,
  },
  {
    id: "cloudburst",
    name: "Urban cloudburst",
    description: "Short-duration extreme rainfall exceeding drainage capacity.",
    intensity: 1.55,
  },
  {
    id: "cyclone",
    name: "Cyclonic landfall",
    description: "Coastal system with storm surge and multi-day rainfall.",
    intensity: 1.85,
  },
];

export const DATA_SOURCES: DataSource[] = [
  {
    id: "insat-sim",
    name: "INSAT-class IR cloud proxy (simulated)",
    kind: "satellite",
    status: "simulated",
    latencyMinutes: 30,
    quality: 82,
    note: "Placeholder for half-hourly geostationary imagery ingestion.",
  },
  {
    id: "dwr-sim",
    name: "Doppler radar reflectivity (simulated)",
    kind: "radar",
    status: "simulated",
    latencyMinutes: 10,
    quality: 74,
    note: "Nowcasting layer; real feed to be wired via radar API adapter.",
  },
  {
    id: "aws-sim",
    name: "Automatic weather stations (simulated)",
    kind: "station",
    status: "simulated",
    latencyMinutes: 15,
    quality: 88,
    note: "Point rain-gauge network used for bias correction.",
  },
  {
    id: "nwp-sim",
    name: "NWP ensemble 0-72h (simulated)",
    kind: "nwp",
    status: "simulated",
    latencyMinutes: 180,
    quality: 79,
    note: "Deterministic + ensemble spread for uncertainty bands.",
  },
  {
    id: "hydro-sim",
    name: "River gauge & drainage model (simulated)",
    kind: "hydrology",
    status: "degraded",
    latencyMinutes: 60,
    quality: 61,
    note: "Sparse coverage in demo; several basins interpolated.",
  },
  {
    id: "crowd-sim",
    name: "Citizen reports (in-app)",
    kind: "crowd",
    status: "simulated",
    latencyMinutes: 2,
    quality: 55,
    note: "Unverified until cross-checked with gauges.",
  },
];

const BASELINE: Record<
  string,
  { score: number; rain: number; depth: number; onset: number; vulnerability: number }
> = {
  mumbai: { score: 74, rain: 165, depth: 0.9, onset: 4, vulnerability: 86 },
  ahmedabad: { score: 46, rain: 78, depth: 0.35, onset: 11, vulnerability: 58 },
  chennai: { score: 68, rain: 142, depth: 0.75, onset: 6, vulnerability: 81 },
  guwahati: { score: 71, rain: 128, depth: 0.68, onset: 5, vulnerability: 77 },
  patna: { score: 63, rain: 96, depth: 0.6, onset: 9, vulnerability: 73 },
  kochi: { score: 59, rain: 118, depth: 0.52, onset: 7, vulnerability: 69 },
  bengaluru: { score: 42, rain: 62, depth: 0.28, onset: 12, vulnerability: 64 },
  kolkata: { score: 57, rain: 104, depth: 0.48, onset: 8, vulnerability: 75 },
  delhi: { score: 38, rain: 54, depth: 0.24, onset: 14, vulnerability: 60 },
  srinagar: { score: 33, rain: 41, depth: 0.18, onset: 18, vulnerability: 52 },
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "severe";
  if (score >= 60) return "high";
  if (score >= 38) return "moderate";
  return "low";
}

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; action: string; tone: "safe" | "info" | "amber" | "danger" }
> = {
  low: { label: "Low", action: "Routine monitoring", tone: "safe" },
  moderate: { label: "Moderate", action: "Stay alert, avoid low-lying roads", tone: "info" },
  high: { label: "High", action: "Prepare to move valuables and vehicles", tone: "amber" },
  severe: { label: "Severe", action: "Avoid travel; follow local authorities", tone: "danger" },
};

function buildTimeline(rain24: number, seed: string, tickIso: string): RainfallPoint[] {
  const rnd = seeded(seed);
  const now = new Date(tickIso).getTime();
  const shape = [0.05, 0.09, 0.14, 0.18, 0.16, 0.13, 0.09, 0.08, 0.05, 0.03];
  return shape.map((share, i) => {
    const hour = i * 3;
    const jitter = 0.82 + rnd() * 0.36;
    const value = Number((rain24 * share * 1.35 * jitter).toFixed(1));
    const spread = value * (0.22 + rnd() * 0.2);
    const d = new Date(now + hour * 3600_000);
    return {
      hour,
      label: `${String(d.getHours()).padStart(2, "0")}:00`,
      rainfallMm: value,
      lowMm: Number(Math.max(0, value - spread).toFixed(1)),
      highMm: Number((value + spread).toFixed(1)),
    };
  });
}

function buildFactors(
  loc: FloodLocation,
  intensity: number,
  base: (typeof BASELINE)[string],
): RiskFactor[] {
  const rnd = seeded(loc.id + intensity);
  const raw = [
    {
      id: "rainfall",
      label: "Forecast rainfall intensity",
      contribution: 26 + intensity * 10 + rnd() * 6,
      detail: `NWP ensemble + radar nowcast indicate ${Math.round(base.rain * intensity)} mm in 24h.`,
      provenance: "Data acc. to Doppler weather radar (DWR) nowcast + INSAT-3D IR satellite cloud-top temperature + NWP ensemble",
    },
    {
      id: "drainage",
      label: "Drainage capacity deficit",
      contribution: 14 + rnd() * 10,
      detail: `${loc.terrain}. Modelled outfall capacity exceeded during peak 3h block.`,
      provenance: "Data acc. to satellite-derived DEM (SRTM/CartoDEM) terrain slope + municipal stormwater network layer",
    },
    {
      id: "saturation",
      label: "Antecedent soil saturation",
      contribution: 10 + intensity * 6 + rnd() * 5,
      detail: "Prior 7-day rainfall leaves limited infiltration headroom.",
      provenance: "Data acc. to SMAP/Sentinel-1 satellite soil-moisture retrieval + 7-day IMD gauge accumulation",
    },
    {
      id: "hydrology",
      label: "River / tide interaction",
      contribution: 8 + rnd() * 9,
      detail: "Backwater effect delays gravity drainage during high stage or high tide.",
      provenance: "Data acc. to CWC river-gauge telemetry + satellite altimetry water levels + tide tables",
    },
    {
      id: "exposure",
      label: "Exposure & vulnerability",
      contribution: base.vulnerability / 8 + rnd() * 4,
      detail: "Population density, low-lying wards and critical facilities within footprint.",
      provenance: "Data acc. to night-time lights / built-up satellite imagery + census ward exposure layer",
    },
  ];
  const total = raw.reduce((s, f) => s + f.contribution, 0);
  return raw
    .map((f) => ({ ...f, contribution: Math.round((f.contribution / total) * 100) }))
    .sort((a, b) => b.contribution - a.contribution);
}

function buildInundation(loc: FloodLocation, depth: number, seed: string): InundationCell[] {
  const rnd = seeded(seed);
  const cells: InundationCell[] = [];
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = rnd() * Math.PI * 2;
    const radius = 0.02 + rnd() * 0.1;
    const d = depth * (0.35 + rnd() * 0.95);
    if (d < 0.08) continue;
    cells.push({
      lat: loc.lat + Math.sin(angle) * radius,
      lng: loc.lng + Math.cos(angle) * radius * 1.15,
      depthM: Number(d.toFixed(2)),
    });
  }
  return cells;
}

export function buildAssessment(
  loc: FloodLocation,
  scenarioId: ScenarioId,
  tickIso: string,
): RiskAssessment {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[1]!;
  const base = BASELINE[loc.id] ?? BASELINE["delhi"]!;
  const rnd = seeded(loc.id + scenarioId);
  const intensity = scenario.intensity;

  const score = Math.round(clamp(base.score * (0.55 + intensity * 0.52) + rnd() * 5, 4, 99));
  const rainfall24hMm = Math.round(base.rain * intensity * (0.9 + rnd() * 0.25));
  const rainfall6hMm = Math.round(rainfall24hMm * (0.3 + rnd() * 0.12));
  const waterDepthM = Number((base.depth * intensity * (0.85 + rnd() * 0.4)).toFixed(2));
  const onsetHours = Math.max(1, Math.round(base.onset / Math.max(0.6, intensity)));
  const confidence = Math.round(clamp(84 - Math.abs(1 - intensity) * 22 + rnd() * 8, 42, 93));

  return {
    locationId: loc.id,
    level: levelFromScore(score),
    score,
    rainfall24hMm,
    rainfall6hMm,
    waterDepthM,
    onsetHours,
    confidence,
    updatedAt: tickIso,
    sources: ["insat-sim", "dwr-sim", "aws-sim", "nwp-sim", "hydro-sim"],
    timeline: buildTimeline(rainfall24hMm, loc.id + scenarioId, tickIso),
    factors: buildFactors(loc, intensity, base),
    inundation: buildInundation(loc, waterDepthM, loc.id + scenarioId),
    affectedPopulation: loc.population,
    advisory: RISK_LEVEL_META[levelFromScore(score)].action,
  };
}

export function buildAssessments(
  scenarioId: ScenarioId,
  tickIso: string,
): Record<string, RiskAssessment> {
  return Object.fromEntries(
    LOCATIONS.map((l) => [l.id, buildAssessment(l, scenarioId, tickIso)]),
  );
}

export const SEED_REPORTS: CitizenReport[] = [
  {
    id: "r1",
    locationId: "mumbai",
    city: "Mumbai",
    severity: "severe",
    waterDepthLabel: "Knee to waist (0.5–1.0 m)",
    description: "Hindmata junction waterlogged, buses diverted. Water entering shopfronts.",
    reportedAt: new Date(Date.now() - 14 * 60_000).toISOString(),
    verified: true,
    reporter: "Citizen • ward volunteer",
  },
  {
    id: "r2",
    locationId: "chennai",
    city: "Chennai",
    severity: "high",
    waterDepthLabel: "Ankle to knee (0.2–0.5 m)",
    description: "Velachery service road submerged, two-wheelers stalling near subway.",
    reportedAt: new Date(Date.now() - 43 * 60_000).toISOString(),
    verified: true,
    reporter: "Citizen",
  },
  {
    id: "r3",
    locationId: "guwahati",
    city: "Guwahati",
    severity: "high",
    waterDepthLabel: "Ankle to knee (0.2–0.5 m)",
    description: "Hill runoff carrying silt into Zoo Road lanes after 90 min of rain.",
    reportedAt: new Date(Date.now() - 96 * 60_000).toISOString(),
    verified: false,
    reporter: "Citizen",
  },
  {
    id: "r4",
    locationId: "bengaluru",
    city: "Bengaluru",
    severity: "moderate",
    waterDepthLabel: "Below ankle (<0.2 m)",
    description: "Outer Ring Road underpass slow-moving, drains partly blocked.",
    reportedAt: new Date(Date.now() - 172 * 60_000).toISOString(),
    verified: false,
    reporter: "Citizen",
  },
  {
    id: "r5",
    locationId: "patna",
    city: "Patna",
    severity: "moderate",
    waterDepthLabel: "Ankle to knee (0.2–0.5 m)",
    description: "Kankarbagh colony lanes holding water since morning showers.",
    reportedAt: new Date(Date.now() - 260 * 60_000).toISOString(),
    verified: true,
    reporter: "Citizen",
  },
];

export function findLocation(id: string) {
  return LOCATIONS.find((l) => l.id === id);
}

export function sourceById(id: string) {
  return DATA_SOURCES.find((s) => s.id === id);
}
