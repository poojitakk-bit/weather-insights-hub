import { CloudRain, Droplets, Timer, TrendingUp } from "lucide-react";

import { RISK_LEVEL_META, LOCATIONS } from "@/lib/flood/mock-data";
import { levelClasses, onsetLabel } from "@/lib/flood/format";
import type { RiskAssessment } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function SummaryCards({
  assessments,
  selectedId,
  onSelect,
}: {
  assessments: Record<string, RiskAssessment>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const rows = LOCATIONS.map((l) => ({ loc: l, a: assessments[l.id] })).filter(
    (r): r is { loc: (typeof LOCATIONS)[number]; a: RiskAssessment } => Boolean(r.a),
  );
  const sorted = [...rows].sort((x, y) => y.a.score - x.a.score);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map(({ loc, a }) => {
        const c = levelClasses[a.level];
        const active = loc.id === selectedId;
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className={cn(
              "glass-panel group rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5",
              active && "ring-2 ring-inset",
              active && c.ring,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-base text-foreground">{loc.city}</p>
                <p className="text-xs text-muted-foreground">{loc.state}</p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                  c.badge,
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    c.dot,
                    a.level === "severe" && "pulse-ring",
                  )}
                />
                {RISK_LEVEL_META[a.level].label}
              </span>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <span className={cn("font-display text-3xl leading-none", c.text)}>{a.score}</span>
              <span className="pb-0.5 text-xs text-muted-foreground">/100 risk score</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised/70">
              <div
                className={cn("h-full rounded-full transition-all", c.bar)}
                style={{ width: `${a.score}%` }}
              />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CloudRain className="size-3.5 text-info" />
                <span className="text-foreground">{a.rainfall24hMm} mm</span>/24h
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Droplets className="size-3.5 text-info" />
                <span className="text-foreground">{a.waterDepthM.toFixed(2)} m</span> depth
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer className="size-3.5 text-amber" />
                {onsetLabel(a.onsetHours)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="size-3.5 text-safe" />
                {a.confidence}% confidence
              </div>
            </dl>
          </button>
        );
      })}
    </div>
  );
}
