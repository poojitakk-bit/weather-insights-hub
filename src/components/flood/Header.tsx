import { Activity, ShieldAlert, Waves, WifiOff } from "lucide-react";

import { DISCLAIMER, LOCATIONS, SCENARIOS } from "@/lib/flood/mock-data";
import { clockTime } from "@/lib/flood/format";
import type { RiskAssessment, ScenarioId } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function Header({
  scenario,
  tickIso,
  offline,
  assessments,
}: {
  scenario: ScenarioId;
  tickIso: string;
  offline: boolean;
  assessments: Record<string, RiskAssessment>;
}) {
  const list = LOCATIONS.map((l) => assessments[l.id]).filter(Boolean) as RiskAssessment[];
  const severe = list.filter((a) => a.level === "severe").length;
  const high = list.filter((a) => a.level === "high").length;
  const scenarioName = SCENARIOS.find((s) => s.id === scenario)?.name ?? "Demo";

  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/20 ring-1 ring-inset ring-border">
            <Waves className="size-6 text-info" />
          </span>
          <div>
            <h1 className="font-display text-xl leading-tight sm:text-2xl">
              <span className="text-gradient-flood">Weather Insights</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              AI/ML heavy-rainfall early warning &amp; inundation prediction · research prototype
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber">
            <Activity className="size-3.5" /> Demo mode · {scenarioName}
          </span>
          <span className="rounded-full border border-border bg-surface/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            {clockTime(tickIso)} IST
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold",
              offline
                ? "border-amber/40 bg-amber/15 text-amber"
                : "border-safe/30 bg-safe/15 text-safe",
            )}
          >
            {offline ? <WifiOff className="size-3.5" /> : <span className="size-2 rounded-full bg-safe" />}
            {offline ? "Offline" : "Simulated feed live"}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-danger/35 bg-danger/15 px-3 py-1.5 text-[11px] font-semibold text-danger">
            <ShieldAlert className="size-3.5" /> {severe} severe · {high} high
          </span>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6">
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs leading-relaxed text-foreground">
          <span className="font-semibold text-danger">Disclaimer:</span> {DISCLAIMER}
        </p>
      </div>
    </header>
  );
}
