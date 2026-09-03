import { Radar, Radio, Satellite, Server, Users, Waves } from "lucide-react";

import { DATA_SOURCES } from "@/lib/flood/mock-data";
import type { DataSource } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

const ICONS: Record<DataSource["kind"], typeof Radar> = {
  satellite: Satellite,
  radar: Radar,
  station: Radio,
  nwp: Server,
  hydrology: Waves,
  crowd: Users,
};

const STATUS: Record<DataSource["status"], { label: string; cls: string }> = {
  simulated: { label: "Demo / simulated", cls: "border-info/30 bg-info/15 text-info" },
  degraded: { label: "Degraded", cls: "border-amber/30 bg-amber/15 text-amber" },
  offline: { label: "Offline", cls: "border-danger/40 bg-danger/15 text-danger" },
};

export function DataQualityPanel({ offline }: { offline: boolean }) {
  const avg = Math.round(DATA_SOURCES.reduce((s, d) => s + d.quality, 0) / DATA_SOURCES.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Composite data health
          </p>
          <p className="font-display text-2xl text-foreground">{avg}%</p>
        </div>
        <p className="max-w-xs text-xs text-muted-foreground">
          No live satellite or radar feeds are connected. Every source below is a placeholder adapter
          ready for a real API.
        </p>
      </div>

      <ul className="space-y-2">
        {DATA_SOURCES.map((s) => {
          const Icon = ICONS[s.kind];
          const status = offline ? STATUS.offline : STATUS[s.status];
          return (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-surface/40 px-3 py-2.5 transition-colors hover:bg-surface/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Icon className="size-4 text-info" />
                  {s.name}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    status.cls,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised/70">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.quality > 75 ? "bg-safe" : s.quality > 60 ? "bg-amber" : "bg-danger",
                    )}
                    style={{ width: `${offline ? 0 : s.quality}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {offline ? "—" : `${s.quality}%`} · {s.latencyMinutes}m lag
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.note}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
