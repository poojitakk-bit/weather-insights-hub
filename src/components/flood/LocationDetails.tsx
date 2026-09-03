import { Clock, Users } from "lucide-react";

import { RISK_LEVEL_META, findLocation, sourceById } from "@/lib/flood/mock-data";
import { clockTime, depthLabel, levelClasses, onsetLabel, timeAgo } from "@/lib/flood/format";
import type { RiskAssessment } from "@/lib/flood/types";
import { Stat } from "@/components/flood/primitives";
import { cn } from "@/lib/utils";

export function LocationDetails({ assessment }: { assessment: RiskAssessment }) {
  const loc = findLocation(assessment.locationId);
  const c = levelClasses[assessment.level];
  if (!loc) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-foreground">{loc.city}</h3>
          <p className="text-xs text-muted-foreground">
            {loc.state} · {loc.lat.toFixed(3)}°N, {loc.lng.toFixed(3)}°E
          </p>
        </div>
        <div className={cn("rounded-xl border px-3 py-2 text-right", c.badge)}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Risk level</p>
          <p className="font-display text-xl leading-tight">
            {RISK_LEVEL_META[assessment.level].label}
          </p>
        </div>
      </div>

      <p className={cn("rounded-xl border bg-surface/40 px-3 py-2 text-sm", c.badge)}>
        {assessment.advisory}
      </p>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Stat label="Risk score" value={`${assessment.score}/100`} accent={c.text} />
        <Stat
          label="Rainfall forecast"
          value={`${assessment.rainfall24hMm} mm`}
          hint={`${assessment.rainfall6hMm} mm in next 6h`}
        />
        <Stat
          label="Est. water depth"
          value={`${assessment.waterDepthM.toFixed(2)} m`}
          hint={depthLabel(assessment.waterDepthM)}
        />
        <Stat
          label="Expected onset"
          value={onsetLabel(assessment.onsetHours)}
          hint={`Peak block ~${assessment.onsetHours + 3}h`}
        />
        <Stat label="Confidence" value={`${assessment.confidence}%`} hint="Ensemble agreement" />
        <Stat
          label="Last updated"
          value={clockTime(assessment.updatedAt)}
          hint={timeAgo(assessment.updatedAt)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 text-info" /> Exposed population {assessment.affectedPopulation}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-amber" /> Horizon 0–27 h
        </span>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Data sources used
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {assessment.sources.map((id) => {
            const s = sourceById(id);
            return (
              <span
                key={id}
                className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {s?.name ?? id}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
