import { SEARCH_PLACES, haversineKm } from "./places";

export type SafePlaceKind = "shelter" | "hospital" | "school" | "highground" | "community";

export interface SafePlace {
  id: string;
  name: string;
  kind: SafePlaceKind;
  city: string;
  state: string;
  lat: number;
  lng: number;
  /** Metres above the surrounding modelled flood surface. */
  elevationAdvantageM: number;
  capacity: number;
  facilities: string[];
  contact: string;
}

export const KIND_META: Record<SafePlaceKind, { label: string; blurb: string }> = {
  shelter: { label: "Relief shelter", blurb: "Designated multi-purpose cyclone/flood shelter" },
  hospital: { label: "Hospital", blurb: "Emergency medical facility on raised ground" },
  school: { label: "School refuge", blurb: "Government school used as monsoon refuge point" },
  highground: { label: "High ground", blurb: "Elevated open ground above modelled inundation" },
  community: { label: "Community hall", blurb: "Municipal hall with stores and generator backup" },
};

const TEMPLATES: {
  kind: SafePlaceKind;
  suffix: string;
  facilities: string[];
  cap: number;
}[] = [
  {
    kind: "shelter",
    suffix: "Multi-Purpose Flood Shelter",
    facilities: ["Dry bedding", "Drinking water", "Generator backup"],
    cap: 1200,
  },
  {
    kind: "hospital",
    suffix: "Civil Hospital (raised block)",
    facilities: ["Trauma care", "24×7 power", "Ambulance bay"],
    cap: 400,
  },
  {
    kind: "school",
    suffix: "Government Higher Secondary School",
    facilities: ["First floor refuge", "Kitchen", "Sanitation"],
    cap: 800,
  },
  {
    kind: "highground",
    suffix: "Ridge Ground Assembly Point",
    facilities: ["Open assembly", "Vehicle parking", "Helipad marking"],
    cap: 2500,
  },
  {
    kind: "community",
    suffix: "Municipal Community Hall",
    facilities: ["Relief stores", "Medical desk", "Child care corner"],
    cap: 600,
  },
];

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

/** Deterministic synthetic shelter network across every searchable Indian city. */
export const SAFE_PLACES: SafePlace[] = SEARCH_PLACES.flatMap((place) => {
  const rnd = seeded(place.id);
  const count = place.covered ? 4 : 2;
  const offset = Math.floor(rnd() * TEMPLATES.length);
  return Array.from({ length: count }, (_, i) => {
    // distinct template per shelter so names never repeat within a city
    const t = TEMPLATES[(offset + i) % TEMPLATES.length]!;
    const angle = rnd() * Math.PI * 2;
    const radius = 0.02 + rnd() * 0.09;
    return {
      id: `${place.id}-safe-${i}`,
      name: `${place.city} ${t.suffix}`,
      kind: t.kind,
      city: place.city,
      state: place.state,
      lat: Number((place.lat + Math.sin(angle) * radius).toFixed(4)),
      lng: Number((place.lng + Math.cos(angle) * radius * 1.15).toFixed(4)),
      elevationAdvantageM: Number((1.2 + rnd() * 6.4).toFixed(1)),
      capacity: Math.round(t.cap * (0.6 + rnd() * 0.8)),
      facilities: t.facilities,
      contact: `1077 · District EOC (${place.state})`,
    };
  });
});

export interface RankedSafePlace extends SafePlace {
  distanceKm: number;
  bearing: string;
  etaMinutes: number;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function bearingOf(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const la1 = (from.lat * Math.PI) / 180;
  const la2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return COMPASS[Math.round(((deg + 360) % 360) / 45) % 8]!;
}

export function nearestSafePlaces(
  point: { lat: number; lng: number },
  limit = 4,
): RankedSafePlace[] {
  return SAFE_PLACES.map((p) => {
    const distanceKm = haversineKm(point, p);
    return {
      ...p,
      distanceKm: Number(distanceKm.toFixed(1)),
      bearing: bearingOf(point, p),
      // Congested monsoon travel assumption: ~22 km/h effective speed.
      etaMinutes: Math.max(3, Math.round((distanceKm / 22) * 60)),
    };
  })
    .sort((a, b) => a.distanceKm - b.distanceKm || b.elevationAdvantageM - a.elevationAdvantageM)
    .slice(0, limit);
}
