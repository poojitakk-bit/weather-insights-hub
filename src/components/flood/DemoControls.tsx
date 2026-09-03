import { FlaskConical, RefreshCw } from "lucide-react";

import { SCENARIOS } from "@/lib/flood/mock-data";
import { clockTime } from "@/lib/flood/format";
import type { ScenarioId } from "@/lib/flood/types";
import type { FloodModel } from "@/lib/flood/useFloodModel";
import { cn } from "@/lib/utils";

function Toggle({
  label,
  checked,
  onChange,
  tone = "info",
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "info" | "amber" | "danger";
}) {
  const toneCls =
    tone === "danger" ? "bg-danger" : tone === "amber" ? "bg-amber" : "bg-info";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2 text-left text-xs transition-colors hover:bg-surface/80"
    >
      <span className="text-foreground">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? toneCls : "bg-surface-raised",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background transition-all",
            checked ? "left-[1.15rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function DemoControls({ model }: { model: FloodModel }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2.5">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-amber">Demo Mode is active.</span> All rainfall,
          inundation and risk values are simulated for demonstration. No live satellite, radar,
          station or NWP feed is connected.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Scenario
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => model.setScenario(s.id as ScenarioId)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition-colors",
                model.scenario === s.id
                  ? "border-info/50 bg-info/15"
                  : "border-border bg-surface/50 hover:bg-surface/80",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  model.scenario === s.id ? "text-info" : "text-foreground",
                )}
              >
                {s.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <Toggle
          label="Auto refresh (30s)"
          checked={model.autoRefresh}
          onChange={model.setAutoRefresh}
        />
        <Toggle
          label="Inundation layer"
          checked={model.showInundation}
          onChange={model.setShowInundation}
        />
        <Toggle
          label="Simulate offline"
          checked={model.offline}
          onChange={model.setOffline}
          tone="amber"
        />
        <Toggle
          label="Simulate pipeline error"
          checked={model.forceError}
          onChange={model.setForceError}
          tone="danger"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="font-mono text-[11px] text-muted-foreground">
          snapshot {clockTime(model.tickIso)} IST
        </p>
        <button
          onClick={model.refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
        >
          <RefreshCw className={cn("size-3.5", model.status === "loading" && "animate-spin")} />
          Recompute now
        </button>
      </div>
    </div>
  );
}
