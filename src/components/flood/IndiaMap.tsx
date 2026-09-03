  import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Circle,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Layers, MapPin, Search, ShieldCheck, X } from "lucide-react";

import { LOCATIONS } from "@/lib/flood/mock-data";
import { levelHex } from "@/lib/flood/format";
import { searchPlaces, type SearchPlace } from "@/lib/flood/places";
import type { RiskAssessment } from "@/lib/flood/types";
import { cn } from "@/lib/utils";
import {
  GIBS_ATTRIBUTION,
  gibsImergUrl,
  gibsTrueColorUrl,
} from "@/services/satelliteService";
import {
  getRadarComposite,
  radarTileUrl,
  RAINVIEWER_ATTRIBUTION,
  type RadarComposite,
} from "@/services/radarService";

function FlyTo({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.1 });
  }, [lat, lng, zoom, map]);

  return null;
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: ((lat: number, lng: number, name?: string) => void) | undefined;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

interface SafeMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

interface Props {
  assessments: Record<string, RiskAssessment>;
  selectedId: string;
  onSelect: (id: string) => void;
  showInundation: boolean;
  onToggleInundation: (v: boolean) => void;
  userLocation?: { lat: number; lng: number } | null;
  safePlaces?: SafeMarker[];
  pinnedLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number, name?: string) => void;
}

interface GeocodedPlace {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  covered: false;
}

export default function IndiaMap({
  assessments,
  selectedId,
  onSelect,
  showInundation,
  onToggleInundation,
  userLocation,
  safePlaces = [],
  pinnedLocation,
  onMapClick,
}: Props) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const [view, setView] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  }>({
    lat: 22.6,
    lng: 80.9,
    zoom: 4.4,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Existing local/demo locations.
   * These are still used first so the original modelled cities
   * continue working exactly as before.
   */
  const localResults = useMemo(
    () => searchPlaces(query),
    [query],
  );

  /*
   * Live Open-Meteo geocoding for locations that aren't
   * present in the local demo dataset.
   *
   * Example:
   * Kurnool
   * Nashik
   * Kolhapur
   * Aurangabad
   * Surat
   * etc.
   */
  const [geocodedPlace, setGeocodedPlace] =
    useState<GeocodedPlace | null>(null);

  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    // If the existing local search already found something,
    // don't make an unnecessary API request.
    if (!trimmed || localResults.length > 0) {
      setGeocodedPlace(null);
      setGeocoding(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setGeocoding(true);

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            trimmed,
          )}&count=5&language=en&format=json`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Geocoding request failed");
        }

        const data = await response.json();

        const indiaResult = data.results?.find(
          (place: {
            country_code?: string;
            latitude?: number;
            longitude?: number;
            name?: string;
          }) =>
            place.country_code === "IN" &&
            typeof place.latitude === "number" &&
            typeof place.longitude === "number",
        );

        if (indiaResult) {
          setGeocodedPlace({
            id: `geocoded-${indiaResult.latitude}-${indiaResult.longitude}`,
            city: indiaResult.name ?? trimmed,
            state: indiaResult.admin1 ?? "",
            lat: indiaResult.latitude,
            lng: indiaResult.longitude,
            covered: false,
          });
        } else {
          setGeocodedPlace(null);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setGeocodedPlace(null);
      } finally {
        setGeocoding(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, localResults.length]);

  const [layers, setLayers] = useState({
    satellite: false,
    imerg: false,
    radar: false,
  });

  const [opacity, setOpacity] = useState(0.6);

  const [radar, setRadar] = useState<RadarComposite | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);

  useEffect(() => {
    delete (
      L.Icon.Default.prototype as unknown as {
        _getIconUrl?: unknown;
      }
    )._getIconUrl;
  }, []);

  useEffect(() => {
    if (!layers.radar || radar) return;

    const controller = new AbortController();

    getRadarComposite(controller.signal)
      .then((c) => {
        setRadar(c);
        setRadarError(null);
      })
      .catch((err: unknown) => {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        setRadarError(
          err instanceof Error
            ? err.message
            : "Radar data unavailable.",
        );
      });

    return () => controller.abort();
  }, [layers.radar, radar]);

  /*
   * Handles both:
   * 1. Existing modelled cities
   * 2. New cities found through Open-Meteo
   */
  const selectPlace = (
    p: SearchPlace | GeocodedPlace,
  ) => {
    setQuery("");
    setGeocodedPlace(null);
    setNotice(null);

    setView({
      lat: p.lat,
      lng: p.lng,
      zoom: p.covered ? 10 : 9,
    });

    if (p.covered) {
      onSelect(p.id);
    } else if ("proxyId" in p && p.proxyId) {
      onSelect(p.proxyId);

      setNotice(
        `${p.city}, ${p.state} is not directly modelled — showing live data for ${p.city}.`,
      );
    } else {
      setNotice(
        `${p.city}, ${p.state} is being analysed using live weather and ML data.`,
      );
    }

    onMapClick?.(
      p.lat,
      p.lng,
      `${p.city}${p.state ? `, ${p.state}` : ""}`,
    );

    inputRef.current?.blur();
  };

  const toggle = (
    key: keyof typeof layers,
  ) =>
    setLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border sm:h-[520px]">
      <MapContainer
        center={[view.lat, view.lng]}
        zoom={view.zoom}
        minZoom={4}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {layers.satellite ? (
          <TileLayer
            key="gibs-truecolor"
            url={gibsTrueColorUrl()}
            attribution={GIBS_ATTRIBUTION}
            opacity={opacity}
            maxNativeZoom={8}
            tms={false}
          />
        ) : null}

        {layers.imerg ? (
          <TileLayer
            key="gibs-imerg"
            url={gibsImergUrl()}
            attribution={GIBS_ATTRIBUTION}
            opacity={opacity}
            maxNativeZoom={6}
          />
        ) : null}

        {layers.radar && radar ? (
          <TileLayer
            key={`radar-${radar.latest.time}`}
            url={radarTileUrl(radar)}
            attribution={RAINVIEWER_ATTRIBUTION}
            opacity={opacity}
          />
        ) : null}

        <FlyTo
          lat={view.lat}
          lng={view.lng}
          zoom={view.zoom}
        />

        <ClickHandler onMapClick={onMapClick} />

        {showInundation &&
          LOCATIONS.flatMap((loc) => {
            const a = assessments[loc.id];

            if (!a) return [];

            return a.inundation.map((c, i) => (
              <Circle
                key={`${loc.id}-inund-${i}`}
                center={[c.lat, c.lng]}
                radius={
                  1400 + c.depthM * 2600
                }
                pathOptions={{
                  color: levelHex[a.level],
                  fillColor: levelHex[a.level],
                  fillOpacity:
                    0.16 +
                    Math.min(
                      0.3,
                      c.depthM * 0.22,
                    ),
                  weight: 0.6,
                  opacity: 0.5,
                }}
              >
                <Popup>
                  <span className="text-xs">
                    Predicted inundation ·{" "}
                    {c.depthM.toFixed(2)} m ·{" "}
                    {loc.city}
                  </span>
                </Popup>
              </Circle>
            ));
          })}

        {LOCATIONS.map((loc) => {
          const a = assessments[loc.id];

          if (!a) return null;

          const active =
            loc.id === selectedId;

          return (
            <CircleMarker
              key={loc.id}
              center={[loc.lat, loc.lng]}
              radius={active ? 12 : 8}
              pathOptions={{
                color: active
                  ? "#ffffff"
                  : levelHex[a.level],
                fillColor: levelHex[a.level],
                fillOpacity: 0.9,
                weight: active ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => {
                  onSelect(loc.id);

                  onMapClick?.(
                    loc.lat,
                    loc.lng,
                    `${loc.city}, ${loc.state}`,
                  );
                },
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>
                    {loc.city}, {loc.state}
                  </strong>
                  <br />
                  Risk {a.score}/100 ·{" "}
                  {a.level}
                  <br />
                  {a.rainfall24hMm} mm/24h ·
                  depth{" "}
                  {a.waterDepthM.toFixed(2)} m
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {userLocation ? (
          <CircleMarker
            center={[
              userLocation.lat,
              userLocation.lng,
            ]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#38bdf8",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <span className="text-xs">
                You are here
              </span>
            </Popup>
          </CircleMarker>
        ) : null}

        {pinnedLocation ? (
          <CircleMarker
            center={[
              pinnedLocation.lat,
              pinnedLocation.lng,
            ]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#f59e0b",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <span className="text-xs">
                Pinned point — live weather + ML
              </span>
            </Popup>
          </CircleMarker>
        ) : null}

        {safePlaces.map((sp) => (
          <CircleMarker
            key={sp.id}
            center={[sp.lat, sp.lng]}
            radius={7}
            pathOptions={{
              color: "#0b1220",
              fillColor: "#37d399",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>{sp.name}</strong>
                <br />
                Safe place ·{" "}
                {sp.distanceKm} km away
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Search bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3">
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <div className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />

            <input
              ref={inputRef}
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search a city or state in India…"
              aria-label="Search a place on the map"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setGeocodedPlace(null);
                  setNotice(null);
                }}
              >
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            ) : null}
          </div>

          {/* Existing local results */}
          {localResults.length > 0 ? (
            <ul className="glass-panel mt-2 max-h-64 overflow-auto rounded-xl p-1 scroll-slim">
              {localResults.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() =>
                      selectPlace(p)
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-info" />

                      <span className="text-foreground">
                        {p.city}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {p.state}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        p.covered
                          ? "border-safe/30 bg-safe/15 text-safe"
                          : "border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {p.covered
                        ? "modelled"
                        : "live"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : geocoding ? (
            /* Live geocoding loading */
            <div className="glass-panel mt-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
              Searching India…
            </div>
          ) : geocodedPlace ? (
            /* Live geocoded result */
            <ul className="glass-panel mt-2 overflow-auto rounded-xl p-1">
              <li>
                <button
                  onClick={() =>
                    selectPlace(
                      geocodedPlace,
                    )
                  }
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-info" />

                    <span className="text-foreground">
                      {geocodedPlace.city}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {geocodedPlace.state}
                    </span>
                  </span>

                  <span className="rounded-full border border-info/30 bg-info/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-info">
                    live
                  </span>
                </button>
              </li>
            </ul>
          ) : query.trim() ? (
            <div className="glass-panel mt-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
              No location found in India.
            </div>
          ) : null}

          {notice ? (
            <div className="glass-panel mt-2 rounded-xl border-amber/30 px-3 py-2 text-xs text-amber">
              {notice}
            </div>
          ) : null}
        </div>
      </div>

      {/* Layer toggle + legend */}
      <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-2">
        <button
          onClick={() =>
            onToggleInundation(
              !showInundation,
            )
          }
          className={cn(
            "glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            showInundation
              ? "text-info"
              : "text-muted-foreground",
          )}
        >
          <Layers className="size-4" />

          Inundation layer{" "}
          {showInundation ? "on" : "off"}
        </button>

        <div className="glass-panel rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Live overlays
          </p>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(
              [
                ["satellite", "NASA VIIRS"],
                ["imerg", "IMERG rain"],
                ["radar", "Radar"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  toggle(key)
                }
                aria-pressed={layers[key]}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  layers[key]
                    ? "border-info/40 bg-info/15 text-info"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {layers.radar && !radar ? (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {radarError ??
                "Loading radar frames…"}
            </p>
          ) : null}

          {layers.satellite ||
          layers.imerg ||
          layers.radar ? (
            <label className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              Opacity

              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                aria-label="Overlay opacity"
                onChange={(e) =>
                  setOpacity(
                    Number(e.target.value),
                  )
                }
                className="h-1 w-24 accent-[color:var(--color-info,#38bdf8)]"
              />
            </label>
          ) : null}
        </div>

        <div className="glass-panel rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Risk level
          </p>

          <div className="mt-1.5 flex flex-wrap gap-2">
            {(
              [
                "low",
                "moderate",
                "high",
                "severe",
              ] as const
            ).map((l) => (
              <span
                key={l}
                className="flex items-center gap-1.5 text-[11px] capitalize"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      levelHex[l],
                  }}
                  aria-hidden
                />

                {l}
              </span>
            ))}

            {safePlaces.length ? (
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="size-3 text-safe" />

                Safe place
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
