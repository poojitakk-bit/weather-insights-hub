import { MapPin } from "lucide-react";

import { ErrorState, LoadingState, Stat } from "@/components/flood/primitives";
import type { LocationWeather } from "@/services/weatherService";

export type PinnedWeatherStatus = "loading" | "ready" | "error";

interface Props {
  coords: { lat: number; lng: number };
  status: PinnedWeatherStatus;
  weather: LocationWeather | null;
  error: string | null;
  onRetry: () => void;
}

/** Shows real, live weather for a point the user picked on the map (not one of the demo cities). */
export function LiveWeatherPanel({ coords, status, weather, error, onRetry }: Props) {
  return (
    <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pinned location — live weather
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-info" />
            {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source: Open-Meteo
        </span>
      </div>

      {status === "loading" ? (
        <LoadingState label="Fetching live weather from Open-Meteo…" />
      ) : status === "error" ? (
        <ErrorState
          message={error ?? "Could not load live weather for this point."}
          onRetry={onRetry}
        />
      ) : weather ? (
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
      ) : null}
    </div>
  );
}
