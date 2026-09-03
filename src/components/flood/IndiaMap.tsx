import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Circle, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Layers, MapPin, Search, ShieldCheck, X } from "lucide-react";

import { LOCATIONS } from "@/lib/flood/mock-data";
import { levelHex } from "@/lib/flood/format";
import { searchPlaces, type SearchPlace } from "@/lib/flood/places";
import type { RiskAssessment } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.1 });
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: ((lat: number, lng: number) => void) | undefined }) {
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
  onMapClick?: (lat: number, lng: number) => void;
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
  const [view, setView] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 22.6,
    lng: 80.9,
    zoom: 4.4,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchPlaces(query), [query]);

  useEffect(() => {
    // keep default marker asset resolution from breaking in bundlers
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  }, []);

  const selectPlace = (p: SearchPlace) => {
    setQuery("");
    setView({ lat: p.lat, lng: p.lng, zoom: p.covered ? 10 : 8 });
    if (p.covered) {
      onSelect(p.id);
      setNotice(null);
    } else if (p.proxyId) {
      onSelect(p.proxyId);
      setNotice(
        `${p.city}, ${p.state} is not directly modelled — showing the nearest modelled proxy, ${p.proxyCity} (${p.proxyKm} km away).`,
      );
    }
    inputRef.current?.blur();
  };

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
        <FlyTo lat={view.lat} lng={view.lng} zoom={view.zoom} />
        <ClickHandler onMapClick={onMapClick} />

        {showInundation &&
          LOCATIONS.flatMap((loc) => {
            const a = assessments[loc.id];
            if (!a) return [];
            return a.inundation.map((c, i) => (
              <Circle
                key={`${loc.id}-inund-${i}`}
                center={[c.lat, c.lng]}
                radius={1400 + c.depthM * 2600}
                pathOptions={{
                  color: levelHex[a.level],
                  fillColor: levelHex[a.level],
                  fillOpacity: 0.16 + Math.min(0.3, c.depthM * 0.22),
                  weight: 0.6,
                  opacity: 0.5,
                }}
              >
                <Popup>
                  <span className="text-xs">
                    Predicted inundation · {c.depthM.toFixed(2)} m · {loc.city}
                  </span>
                </Popup>
              </Circle>
            ));
          })}

        {LOCATIONS.map((loc) => {
          const a = assessments[loc.id];
          if (!a) return null;
          const active = loc.id === selectedId;
          return (
            <CircleMarker
              key={loc.id}
              center={[loc.lat, loc.lng]}
              radius={active ? 12 : 8}
              pathOptions={{
                color: active ? "#ffffff" : levelHex[a.level],
                fillColor: levelHex[a.level],
                fillOpacity: 0.9,
                weight: active ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(loc.id) }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>
                    {loc.city}, {loc.state}
                  </strong>
                  <br />
                  Risk {a.score}/100 · {a.level}
                  <br />
                  {a.rainfall24hMm} mm/24h · depth {a.waterDepthM.toFixed(2)} m
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {userLocation ? (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", fillColor: "#38bdf8", fillOpacity: 1, weight: 3 }}
          >
            <Popup>
              <span className="text-xs">You are here</span>
            </Popup>
          </CircleMarker>
        ) : null}

        {pinnedLocation ? (
          <CircleMarker
            center={[pinnedLocation.lat, pinnedLocation.lng]}
            radius={8}
            pathOptions={{ color: "#ffffff", fillColor: "#f59e0b", fillOpacity: 1, weight: 3 }}
          >
            <Popup>
              <span className="text-xs">Pinned point — live weather</span>
            </Popup>
          </CircleMarker>
        ) : null}

        {safePlaces.map((sp) => (
          <CircleMarker
            key={sp.id}
            center={[sp.lat, sp.lng]}
            radius={7}
            pathOptions={{ color: "#0b1220", fillColor: "#37d399", fillOpacity: 0.95, weight: 2 }}
          >
            <Popup>
              <div className="text-xs">
                <strong>{sp.name}</strong>
                <br />
                Safe place · {sp.distanceKm} km away
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city or state in India…"
              aria-label="Search a place on the map"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query ? (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            ) : null}
          </div>
          {results.length > 0 ? (
            <ul className="glass-panel mt-2 max-h-64 overflow-auto rounded-xl p-1 scroll-slim">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => selectPlace(p)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-info" />
                      <span className="text-foreground">{p.city}</span>
                      <span className="text-xs text-muted-foreground">{p.state}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        p.covered
                          ? "border-safe/30 bg-safe/15 text-safe"
                          : "border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {p.covered ? "modelled" : "no coverage"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="glass-panel mt-2 rounded-xl px-3 py-2 text-xs text-muted-foreground">
              No matching place in the demo dataset.
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
          onClick={() => onToggleInundation(!showInundation)}
          className={cn(
            "glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            showInundation ? "text-info" : "text-muted-foreground",
          )}
        >
          <Layers className="size-4" />
          Inundation layer {showInundation ? "on" : "off"}
        </button>
        <div className="glass-panel rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Risk level
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(["low", "moderate", "high", "severe"] as const).map((l) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] capitalize">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: levelHex[l] }}
                  aria-hidden
                />
                {l}
              </span>
            ))}
            {safePlaces.length ? (
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="size-3 text-safe" /> Safe place
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
