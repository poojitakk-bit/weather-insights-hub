import { AlertTriangle, CheckCircle2, MapPin, Satellite } from "lucide-react";

import { ErrorState, LoadingState, Stat } from "@/components/flood/primitives";
import { cn } from "@/lib/utils";
import type { LocationData } from "@/services/locationDataService";
import type { LocationWeather } from "@/services/weatherService";

export type PinnedWeatherStatus = "idle" | "loading" | "ready" | "error";

interface Props {
  coords: { lat: number; lng: number };
  status: PinnedWeatherStatus;
  /** Full multi-source payload (weather + satellite + radar + risk), when available. */
  data?: LocationData | null;
  /** Weather-only payload, used when the full multi-source payload is not wired up. */
  weather?: LocationWeather | null;
  error: string | null;
  stale?: boolean;
  onRetry: () => void;
}

const levelClass: Record<string, string> = {
  low: "border-safe/30 bg-safe/15 text-safe",
  moderate: "border-info/30 bg-info/15 text-info",
  high: "border-amber/30 bg-amber/15 text-amber",
  severe: "border-destructive/40 bg-destructive/15 text-destructive",
};

/** Live, real data for a point the user picked on the map (not one of the demo cities). */
export function LiveWeatherPanel({
  coords,
  status,
  data = null,
  weather: weatherProp = null,
  error,
  stale = false,
  onRetry,
}: Props) {
  const weather = data?.weather ?? weatherProp ?? null;
  const metrics = weather?.metrics ?? null;

  return (
    <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {data?.name ? `${data.name} — live data` : "Pinned location — live data"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-info" />
            {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
            {stale ? <span className="text-amber">· refreshing…</span> : null}
          </p>
        </div>
        {data ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              levelClass[data.risk.level] ?? "border-border text-muted-foreground",
            )}
          >
            Flood risk {data.risk.score}/100 · {data.risk.level}
          </span>
        ) : null}
      </div>

      {status === "loading" && !data && !weather ? (
        <LoadingState label="Fetching live weather, satellite and radar data…" />
      ) : status === "error" && !data && !weather ? (
        <ErrorState message={error ?? "Could not load live data for this point."} onRetry={onRetry} />
      ) : data || weather ? (
        <div className="space-y-3">
          {weather ? (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Stat
                label="Temperature"
                value={`${weather.current.temperatureC.toFixed(1)}°C`}
                accent="text-amber"
              />
              <Stat label="Humidity" value={`${Math.round(weather.current.humidityPct)}%`} />
              <Stat label="Wind" value={`${weather.current.windSpeedKmh.toFixed(1)} km/h`} />
              <Stat
                label="Rain chance"
                value={`${Math.round(weather.current.precipitationProbabilityPct)}%`}
                hint={`${weather.current.precipitationMm.toFixed(1)} mm this hour`}
              />
            </div>
          ) : (
            <p className="text-xs text-amber">Open-Meteo forecast unavailable for this point.</p>
          )}

          {metrics ? (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              <Stat label="Past 24 h" value={`${metrics.past24hMm.toFixed(1)} mm`} />
              <Stat label="Next 3 h" value={`${metrics.next3hMm.toFixed(1)} mm`} />
              <Stat label="Next 6 h" value={`${metrics.next6hMm.toFixed(1)} mm`} />
              <Stat label="Next 24 h" value={`${metrics.next24hMm.toFixed(1)} mm`} />
              <Stat
                label="Intensity"
                value={metrics.intensityTrend}
                hint={
                  metrics.runoff24hMm !== null
                    ? `${metrics.runoff24hMm.toFixed(1)} mm runoff / 24 h`
                    : "runoff n/a"
                }
              />
            </div>
          ) : null}

          {data?.satellite ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Satellite className="size-3.5 text-info" />
              NASA POWER satellite rainfall {data.satellite.last24hMm.toFixed(1)} mm over its last
              published 24 h — observed data lags real time by {data.satellite.latencyHours} h.
            </p>
          ) : null}

          {data ? (
            <>
          {/* Source availability + agreement */}
          <div className="flex flex-wrap items-center gap-1.5">
            {data.sources.map((s) => (
              <span
                key={s.id}
                title={s.error ?? s.freshness ?? undefined}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  s.ok
                    ? "border-safe/30 bg-safe/10 text-safe"
                    : "border-amber/30 bg-amber/10 text-amber",
                )}
              >
                {s.ok ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                {s.name}
                {s.ok && s.freshness ? ` · ${s.freshness}` : ""}
              </span>
            ))}
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Source agreement: {data.agreement.level}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {data.agreement.detail}
          </p>

          {/* Flood risk drivers */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Flood-risk drivers · {data.risk.coveragePct}% source coverage
            </p>
            {data.risk.drivers.map((d) => (
              <div key={d.id} className="text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className={d.available ? "text-foreground" : "text-muted-foreground"}>
                    {d.label}
                  </span>
                  <span className="text-muted-foreground">
                    {d.available ? `${d.points}/${d.maxPoints} pts` : "no data"}
                  </span>
                </div>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-info"
                    style={{ width: `${(d.points / d.maxPoints) * 100}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {d.detail} · {d.source}
                </p>
              </div>
            ))}
            <p className="text-[10px] leading-relaxed text-muted-foreground">{data.risk.method}</p>
          </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
