import { Brain, Radar, Satellite } from "lucide-react";

import { levelClasses } from "@/lib/flood/format";
import type { RiskAssessment } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function WhyThisRisk({ assessment }: { assessment: RiskAssessment }) {
  const c = levelClasses[assessment.level];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The score of <span className={cn("font-semibold", c.text)}>{assessment.score}/100</span> is
        a weighted blend of rainfall forcing, drainage capacity, catchment state and exposure. Each
        driver below shows its contribution and the observation feed it is derived from.
      </p>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-semibold text-info">
          <Satellite className="size-3.5" /> Satellite-derived inputs
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[11px] font-semibold text-amber">
          <Radar className="size-3.5" /> Radar nowcast inputs
        </span>
      </div>

      <ul className="space-y-3">
        {assessment.factors.map((f) => (
          <li key={f.id} className="rounded-xl border border-border/70 bg-surface/50 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <span className="font-mono text-xs text-muted-foreground">{f.contribution}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-raised/70">
              <div
                className={cn("h-full rounded-full", c.bar)}
                style={{ width: `${f.contribution}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
            {f.provenance ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-info">
                <Satellite className="mt-0.5 size-3 shrink-0" />
                <span>{f.provenance}</span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 rounded-xl border border-info/25 bg-info/10 px-3 py-2.5 text-xs text-muted-foreground">
        <Brain className="mt-0.5 size-4 shrink-0 text-info" />
        <p>
          Prototype explainability: contributions are illustrative feature weights from the demo
          model and the listed satellite/radar feeds are simulated adapters. In production these come
          from SHAP-style attributions over the trained rainfall–inundation model, with per-feature
          provenance from the live INSAT, DWR, AWS and CWC ingest pipelines.
        </p>
      </div>
    </div>
  );
}
