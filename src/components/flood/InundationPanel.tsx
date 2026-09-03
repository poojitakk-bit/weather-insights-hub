import { levelHex } from "@/lib/flood/format";
import type { RiskAssessment } from "@/lib/flood/types";

const BANDS = [
  { id: "b1", label: "0.1 – 0.3 m", note: "Road ponding, slow traffic", min: 0.1, max: 0.3 },
  { id: "b2", label: "0.3 – 0.6 m", note: "Two-wheelers stall, lanes cut off", min: 0.3, max: 0.6 },
  { id: "b3", label: "0.6 – 1.0 m", note: "Ground floors at risk", min: 0.6, max: 1.0 },
  { id: "b4", label: "> 1.0 m", note: "Evacuation planning zone", min: 1.0, max: 99 },
];

export function InundationPanel({ assessment }: { assessment: RiskAssessment }) {
  const cells = assessment.inundation;
  const total = cells.length || 1;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Predicted inundation footprint for the next 24 h, rendered as depth-graded cells on the map.
        Derived from the demo rainfall–runoff surface, not from observed flooding.
      </p>
      <ul className="space-y-2">
        {BANDS.map((b) => {
          const count = cells.filter((c) => c.depthM >= b.min && c.depthM < b.max).length;
          const pct = Math.round((count / total) * 100);
          return (
            <li key={b.id} className="rounded-xl border border-border bg-surface/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span
                    className="size-3 rounded-sm"
                    style={{
                      backgroundColor: levelHex[assessment.level],
                      opacity: 0.25 + b.min * 0.7,
                    }}
                    aria-hidden
                  />
                  {b.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {count} cells · {pct}%
                </span>
              </div>
              <p className="mt-0.5 pl-5 text-[11px] text-muted-foreground">{b.note}</p>
            </li>
          );
        })}
      </ul>
      <p className="rounded-xl border border-border bg-surface/40 px-3 py-2 text-[11px] text-muted-foreground">
        Grid resolution in this prototype is coarse (~2 km). A production build would use DEM-based
        hydrodynamic routing at 30 m and validated drainage network data.
      </p>
    </div>
  );
}
