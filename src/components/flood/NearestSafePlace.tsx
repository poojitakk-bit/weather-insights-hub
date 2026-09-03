import { useCallback, useState } from "react";
import { Building2, Crosshair, HeartPulse, Mountain, Navigation, School, Tent } from "lucide-react";

import { nearestModelled } from "@/lib/flood/places";
import { KIND_META, nearestSafePlaces, type RankedSafePlace, type SafePlaceKind } from "@/lib/flood/safe-places";
import type { RiskAssessment } from "@/lib/flood/types";
import { levelClasses } from "@/lib/flood/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";

const ICONS: Record<SafePlaceKind, typeof Tent> = {
  shelter: Tent,
  hospital: HeartPulse,
  school: School,
  highground: Mountain,
  community: Building2,
};

export interface SafePlaceState {
  coords: { lat: number; lng: number } | null;
  places: RankedSafePlace[];
  nearestCity: { id: string; city: string; km: number } | null;
}

export function NearestSafePlace({
  assessments,
  onLocate,
  onSelectCity,
}: {
  assessments: Record<string, RiskAssessment>;
  onLocate?: (s: SafePlaceState) => void;
  onSelectCity?: (id: string) => void;
}) {
  const [state, setState] = useState<SafePlaceState>({
    coords: null,
    places: [],
    nearestCity: null,
  });
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocation is not supported in this browser.");
      return;
    }
    setStatus("locating");
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const near = nearestModelled(coords);
        const next: SafePlaceState = {
          coords,
          places: nearestSafePlaces(coords, 4),
          nearestCity: { id: near.location.id, city: near.location.city, km: near.km },
        };
        setState(next);
        setStatus("idle");
        onLocate?.(next);
      },
      (err) => {
        setStatus("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access to find the nearest safe place."
            : "Could not read your current location. Try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [onLocate]);

  const cityRisk = state.nearestCity ? assessments[state.nearestCity.id] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Uses your device GPS to rank nearby relief shelters, raised hospitals, school refuges and
          high-ground assembly points by travel distance and elevation advantage.
        </p>
        <button
          onClick={locate}
          disabled={status === "locating"}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Crosshair className={cn("size-4", status === "locating" && "animate-spin")} />
          {status === "locating" ? "Locating…" : state.coords ? "Refresh location" : "Use my location"}
        </button>
      </div>

      {message ? (
        <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
          {message}
        </p>
      ) : null}

      {state.coords ? (
        <div className="rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-xs text-muted-foreground">
          <span className="font-mono text-foreground">
            {state.coords.lat.toFixed(4)}°N, {state.coords.lng.toFixed(4)}°E
          </span>
          {state.nearestCity ? (
            <>
              {" · nearest modelled city "}
              <button
                onClick={() => onSelectCity?.(state.nearestCity!.id)}
                className="font-semibold text-info underline-offset-2 hover:underline"
              >
                {state.nearestCity.city}
              </button>
              {` (${state.nearestCity.km} km)`}
              {cityRisk ? (
                <span className={cn("ml-1 font-semibold capitalize", levelClasses[cityRisk.level].text)}>
                  · {cityRisk.level} risk {cityRisk.score}/100
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {state.places.length === 0 ? (
        <EmptyState
          title="No location shared yet"
          description="Tap “Use my location” to compute the nearest safe places around you."
        />
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {state.places.map((p, i) => {
            const Icon = ICONS[p.kind];
            return (
              <li
                key={p.id}
                className={cn(
                  "rounded-xl border bg-surface/60 p-3 transition-colors",
                  i === 0 ? "border-safe/40 ring-1 ring-safe/25" : "border-border",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-safe/15 text-safe">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      {i === 0 ? (
                        <span className="shrink-0 rounded-full border border-safe/30 bg-safe/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-safe">
                          nearest
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {KIND_META[p.kind].label} · {p.city}, {p.state}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-foreground">
                      {p.distanceKm} km {p.bearing} · ~{p.etaMinutes} min · +
                      {p.elevationAdvantageM} m above flood surface
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Capacity ~{p.capacity.toLocaleString("en-IN")} · {p.facilities.join(" · ")}
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-info hover:underline"
                    >
                      <Navigation className="size-3.5" /> Directions
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Shelter network is a synthetic demonstration layer derived from city centroids — in
        production it is loaded from state disaster-management shelter registries. Call 1077 (district
        EOC) or 112 in a real emergency.
      </p>
    </div>
  );
}
