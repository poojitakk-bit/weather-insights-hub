export type RiskLevel = "low" | "moderate" | "high" | "severe";

export interface FloodLocation {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  population: string;
  /** Typical monsoon driver, used in the explainability panel. */
  terrain: string;
}

export interface RainfallPoint {
  /** Hours from now, e.g. 0, 3, 6 … */
  hour: number;
  label: string;
  rainfallMm: number;
  /** Uncertainty band around the deterministic value. */
  lowMm: number;
  highMm: number;
}

export interface RiskFactor {
  id: string;
  label: string;
  /** 0-100 contribution weight to the final score. */
  contribution: number;
  detail: string;
  /** Which observation feed the driver is derived from (satellite, radar, gauges…). */
  provenance?: string;
}

export interface DataSource {
  id: string;
  name: string;
  kind: "satellite" | "radar" | "station" | "nwp" | "hydrology" | "crowd";
  status: "simulated" | "degraded" | "offline";
  latencyMinutes: number;
  /** 0-100 quality/health score. */
  quality: number;
  note: string;
}

export interface InundationCell {
  lat: number;
  lng: number;
  depthM: number;
}

export interface RiskAssessment {
  locationId: string;
  level: RiskLevel;
  score: number;
  rainfall24hMm: number;
  rainfall6hMm: number;
  waterDepthM: number;
  onsetHours: number;
  confidence: number;
  updatedAt: string;
  sources: string[];
  timeline: RainfallPoint[];
  factors: RiskFactor[];
  inundation: InundationCell[];
  affectedPopulation: string;
  advisory: string;
}

export interface CitizenReport {
  id: string;
  locationId: string;
  city: string;
  severity: RiskLevel;
  waterDepthLabel: string;
  description: string;
  reportedAt: string;
  verified: boolean;
  reporter: string;
}

export type ScenarioId = "normal" | "monsoon" | "cloudburst" | "cyclone";

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  /** Multiplier applied to baseline rainfall & score. */
  intensity: number;
}
