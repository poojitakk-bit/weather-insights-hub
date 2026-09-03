import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RainfallPoint } from "@/lib/flood/types";

export function RainfallTimeline({ timeline }: { timeline: RainfallPoint[] }) {
  const data = timeline.map((p) => ({
    ...p,
    band: [p.lowMm, p.highMm] as [number, number],
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="rainBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            stroke="var(--color-border)"
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            stroke="var(--color-border)"
            unit=" mm"
            width={62}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-foreground)",
            }}
            formatter={(value: unknown, name: string) =>
              name === "band"
                ? [
                    `${(value as [number, number])[0]}–${(value as [number, number])[1]} mm`,
                    "Ensemble range",
                  ]
                : [`${value as number} mm`, "Forecast (3h)"]
            }
          />
          <Area
            dataKey="band"
            stroke="none"
            fill="var(--color-amber)"
            fillOpacity={0.14}
            isAnimationActive={false}
          />
          <Bar dataKey="rainfallMm" fill="url(#rainBar)" radius={[6, 6, 0, 0]} barSize={18} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RainfallSparkline({ timeline }: { timeline: RainfallPoint[] }) {
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timeline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area
            dataKey="rainfallMm"
            stroke="var(--color-info)"
            fill="var(--color-info)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
