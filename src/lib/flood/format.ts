import type { RiskLevel } from "./types";

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function clockTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function onsetLabel(hours: number) {
  if (hours <= 1) return "Within 1 hour";
  if (hours < 24) return `In ~${hours} hours`;
  return `In ~${Math.round(hours / 24)} days`;
}

export function depthLabel(m: number) {
  if (m < 0.15) return "Nuisance ponding";
  if (m < 0.35) return "Below ankle–ankle";
  if (m < 0.7) return "Ankle to knee";
  if (m < 1.2) return "Knee to waist";
  return "Above waist";
}

/** Tailwind classes keyed to semantic tokens — no raw colors in components. */
export const levelClasses: Record<
  RiskLevel,
  { badge: string; text: string; bar: string; dot: string; ring: string }
> = {
  low: {
    badge: "bg-safe/15 text-safe border-safe/30",
    text: "text-safe",
    bar: "bg-safe",
    dot: "bg-safe",
    ring: "ring-safe/40",
  },
  moderate: {
    badge: "bg-info/15 text-info border-info/30",
    text: "text-info",
    bar: "bg-info",
    dot: "bg-info",
    ring: "ring-info/40",
  },
  high: {
    badge: "bg-amber/15 text-amber border-amber/30",
    text: "text-amber",
    bar: "bg-amber",
    dot: "bg-amber",
    ring: "ring-amber/40",
  },
  severe: {
    badge: "bg-danger/20 text-danger border-danger/40",
    text: "text-danger",
    bar: "bg-danger",
    dot: "bg-danger",
    ring: "ring-danger/50",
  },
};

export const levelHex: Record<RiskLevel, string> = {
  low: "#37d3a5",
  moderate: "#4aa8f0",
  high: "#f2a93b",
  severe: "#ec4b45",
};
