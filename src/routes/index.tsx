import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Brain,
  CloudRain,
  Database,
  LayoutDashboard,
  MapPinned,
  MessageSquarePlus,
  Radio,
  Settings2,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { DemoControls } from "@/components/flood/DemoControls";
import { DataQualityPanel } from "@/components/flood/DataQualityPanel";
import { Header } from "@/components/flood/Header";
import { InundationPanel } from "@/components/flood/InundationPanel";
import { LocationDetails } from "@/components/flood/LocationDetails";
import { LiveWeatherPanel, type PinnedWeatherStatus } from "@/components/flood/LiveWeatherPanel";
import { RainfallTimeline } from "@/components/flood/RainfallTimeline";
import { ReportForm } from "@/components/flood/ReportForm";
import { ReportsFeed } from "@/components/flood/ReportsFeed";
import { SummaryCards } from "@/components/flood/SummaryCards";
import { AssistantChat } from "@/components/flood/AssistantChat";
import { NearestSafePlace, type SafePlaceState } from "@/components/flood/NearestSafePlace";
import { WhyThisRisk } from "@/components/flood/WhyThisRisk";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
  Panel,
} from "@/components/flood/primitives";
import { DISCLAIMER } from "@/lib/flood/mock-data";
import { clockTime } from "@/lib/flood/format";
import { useFloodModel } from "@/lib/flood/useFloodModel";
import { getLocationWeather, type LocationWeather } from "@/services/weatherService";

const IndiaMap = lazy(() => import("@/components/flood/IndiaMap"));

const TITLE = "India Flood Intelligence — Rainfall & Inundation Early Warning Prototype";
const DESCRIPTION =
  "Research prototype dashboard for AI/ML heavy-rainfall early warning and flood inundation prediction across ten Indian cities, with demo-mode simulated data.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const model = useFloodModel();
  const [mounted, setMounted] = useState(false);
  const [safeState, setSafeState] = useState<SafePlaceState>({
    coords: null,
    places: [],
    nearestCity: null,
  });
  useEffect(() => setMounted(true), []);

  // Free-click map location + its live Open-Meteo weather (independent of the demo-city mock model).
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<PinnedWeatherStatus>("loading");
  const [weather, setWeather] = useState<LocationWeather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const weatherRequestRef = useRef(0);
  const weatherAbortRef = useRef<AbortController | null>(null);

  const loadWeather = useCallback((lat: number, lng: number) => {
    // Cancel any in-flight request and tag this one, so a stale response from an
    // earlier rapid click can never overwrite the weather for the latest click.
    weatherAbortRef.current?.abort();
    const controller = new AbortController();
    weatherAbortRef.current = controller;
    const requestId = ++weatherRequestRef.current;

    setWeatherStatus("loading");
    setWeatherError(null);

    getLocationWeather(lat, lng, controller.signal)
      .then((result) => {
        if (weatherRequestRef.current !== requestId) return;
        setWeather(result);
        setWeatherStatus("ready");
      })
      .catch((err: unknown) => {
        if (weatherRequestRef.current !== requestId) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setWeatherStatus("error");
        setWeatherError(err instanceof Error ? err.message : "Could not load live weather.");
      });
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPinnedLocation({ lat, lng });
      loadWeather(lat, lng);
    },
    [loadWeather],
  );

  const handleRetryWeather = useCallback(() => {
    if (pinnedLocation) loadWeather(pinnedLocation.lat, pinnedLocation.lng);
  }, [pinnedLocation, loadWeather]);

  // Clicking a predefined city keeps working exactly as before, and also clears any pin.
  const handleSelectCity = useCallback(
    (id: string) => {
      setPinnedLocation(null);
      model.setSelectedId(id);
    },
    [model.setSelectedId],
  );

  const { status, offline, selected } = model;
  const blocked = status === "loading" || status === "error" || !selected;

  return (
    <div className="app-backdrop min-h-screen pb-16">
      <div className="app-grid-overlay" aria-hidden />

      <Header
        scenario={model.scenario}
        tickIso={model.tickIso}
        offline={offline}
        assessments={model.assessments}
      />

      <main className="relative mx-auto mt-5 max-w-[1500px] space-y-4 px-4 sm:px-6">
        {offline ? (
          <div className="glass-panel rounded-2xl p-4">
            <OfflineState lastUpdated={clockTime(model.tickIso)} />
          </div>
        ) : null}

        {/* 1. National map + 10. Demo controls */}
        <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <Panel
            title="National India map"
            subtitle="Ten demonstration cities with simulated risk and predicted inundation. Search any place to fly the map."
            icon={<MapPinned className="size-4" />}
            bodyClassName="p-3 sm:p-3"
          >
            {status === "error" ? (
              <ErrorState
                message="Prediction service unreachable"
                onRetry={() => {
                  model.setForceError(false);
                  model.refresh();
                }}
              />
            ) : !mounted || status === "loading" ? (
              <LoadingState label="Initialising map tiles and risk grid…" />
            ) : (
              <Suspense fallback={<LoadingState label="Loading map…" />}>
                <IndiaMap
                  assessments={model.assessments}
                  selectedId={model.selectedId}
                  onSelect={handleSelectCity}
                  showInundation={model.showInundation}
                  onToggleInundation={model.setShowInundation}
                  userLocation={safeState.coords}
                  safePlaces={safeState.places.map((p) => ({
                    id: p.id,
                    name: p.name,
                    lat: p.lat,
                    lng: p.lng,
                    distanceKm: p.distanceKm,
                  }))}
                  pinnedLocation={pinnedLocation}
                  onMapClick={handleMapClick}
                />
              </Suspense>
            )}
          </Panel>

          <Panel
            title="Demo Mode controls"
            subtitle="Switch simulated scenarios and exercise loading, error and offline states."
            icon={<Settings2 className="size-4" />}
          >
            <DemoControls model={model} />
          </Panel>
        </div>

        {/* 2. Forecast & flood-risk summary cards */}
        <Panel
          title="Forecast & flood-risk summary"
          subtitle="Ranked by risk score. Every card shows rainfall, depth, onset and confidence."
          icon={<LayoutDashboard className="size-4" />}
        >
          {status === "error" ? (
            <ErrorState message="Could not compute city risk summaries" onRetry={model.refresh} />
          ) : status === "loading" ? (
            <LoadingState />
          ) : (
            <SummaryCards
              assessments={model.assessments}
              selectedId={model.selectedId}
              onSelect={handleSelectCity}
            />
          )}
        </Panel>

        {/* Nearest safe place for current location */}
        <Panel
          title="Nearest safe place for your current location"
          subtitle="GPS-ranked shelters, raised hospitals, school refuges and high-ground assembly points."
          icon={<ShieldCheck className="size-4" />}
        >
          <NearestSafePlace
            assessments={model.assessments}
            onLocate={setSafeState}
            onSelectCity={handleSelectCity}
          />
        </Panel>

        {/* 3. Selected location + 4. timeline */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Selected location details"
            subtitle="Full prediction record for the selected city."
            icon={<Waves className="size-4" />}
          >
            {blocked ? (
              status === "error" ? (
                <ErrorState message="Location prediction unavailable" onRetry={model.refresh} />
              ) : (
                <LoadingState />
              )
            ) : (
              <LocationDetails assessment={selected} />
            )}
            {pinnedLocation ? (
              <LiveWeatherPanel
                coords={pinnedLocation}
                status={weatherStatus}
                weather={weather}
                error={weatherError}
                onRetry={handleRetryWeather}
              />
            ) : null}
          </Panel>

          <Panel
            title="Rainfall forecast timeline"
            subtitle={
              pinnedLocation
                ? "Live hourly precipitation from Open-Meteo for the pinned point, next hours."
                : "3-hourly accumulation with ensemble uncertainty band, next 27 hours."
            }
            icon={<CloudRain className="size-4" />}
          >
            {pinnedLocation ? (
              weatherStatus === "error" ? (
                <ErrorState
                  message={weatherError ?? "Could not load live rainfall data"}
                  onRetry={handleRetryWeather}
                />
              ) : weatherStatus === "loading" || !weather ? (
                <LoadingState label="Fetching live hourly rainfall from Open-Meteo…" />
              ) : weather.timeline.length === 0 ? (
                <EmptyState
                  title="No forecast hours"
                  description="Open-Meteo returned no hourly precipitation for this window."
                />
              ) : (
                <RainfallTimeline timeline={weather.timeline} />
              )
            ) : blocked ? (
              status === "error" ? (
                <ErrorState message="Forecast timeline unavailable" onRetry={model.refresh} />
              ) : (
                <LoadingState />
              )
            ) : selected.timeline.length === 0 ? (
              <EmptyState
                title="No forecast blocks"
                description="The simulated NWP run returned no rainfall for this window."
              />
            ) : (
              <RainfallTimeline timeline={selected.timeline} />
            )}
          </Panel>
        </div>

        {/* 5. Inundation + 9. Why this risk */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Predicted inundation layer"
            subtitle="Depth bands used to shade the map footprint."
            icon={<BarChart3 className="size-4" />}
          >
            {blocked ? (
              status === "error" ? (
                <ErrorState message="Inundation surface unavailable" onRetry={model.refresh} />
              ) : (
                <LoadingState />
              )
            ) : selected.inundation.length === 0 ? (
              <EmptyState
                title="No inundation predicted"
                description="Modelled depths stay below the 0.1 m reporting threshold for this scenario."
              />
            ) : (
              <InundationPanel assessment={selected} />
            )}
          </Panel>

          <Panel
            title="Why this risk?"
            subtitle="Explainable contribution of each driver to the current score."
            icon={<Brain className="size-4" />}
          >
            {blocked ? (
              status === "error" ? (
                <ErrorState message="Explanation unavailable" onRetry={model.refresh} />
              ) : (
                <LoadingState />
              )
            ) : (
              <WhyThisRisk assessment={selected} />
            )}
          </Panel>
        </div>

        {/* 6. Data sources + 7/8. reports */}
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel
            title="Data sources & data quality"
            subtitle="Adapter slots for satellite, radar, station, NWP and hydrology feeds."
            icon={<Database className="size-4" />}
          >
            <DataQualityPanel offline={offline} />
          </Panel>

          <div className="space-y-4">
            <Panel
              title="Citizen flood report"
              subtitle="Crowd observations to complement model output."
              icon={<MessageSquarePlus className="size-4" />}
            >
              <ReportForm defaultLocationId={model.selectedId} onSubmit={model.addReport} />
            </Panel>

            <Panel
              title="Recent flood reports"
              subtitle="Newest first · unverified until gauge cross-check."
              icon={<Radio className="size-4" />}
            >
              <ReportsFeed reports={model.reports} />
            </Panel>
          </div>
        </div>

        <footer className="glass-panel rounded-2xl px-4 py-4 text-xs leading-relaxed text-muted-foreground">
          <p className="text-foreground">{DISCLAIMER}</p>
          <p className="mt-1.5">
            Hackathon prototype · no live satellite or radar data is used · basemap ©
            OpenStreetMap contributors · architecture keeps satellite, radar, weather
            station and NWP integrations as pluggable modules.
          </p>
        </footer>
      </main>

      <AssistantChat
        context={[
          `Scenario: ${model.scenario}. Updated ${clockTime(model.tickIso)} IST.`,
          selected
            ? `Selected city: ${selected.locationId} — risk ${selected.score}/100 (${selected.level}), ${selected.rainfall24hMm} mm/24h, ${selected.rainfall6hMm} mm/6h, predicted depth ${selected.waterDepthM} m, onset in ~${selected.onsetHours} h, confidence ${selected.confidence}%. Advisory: ${selected.advisory}.`
            : "No city selected yet.",
          selected
            ? `Top drivers: ${selected.factors
                .map((f) => `${f.label} ${f.contribution}%`)
                .join(", ")}.`
            : "",
          safeState.places.length
            ? `User's nearest safe places: ${safeState.places
                .map((p) => `${p.name} (${p.distanceKm} km ${p.bearing}, ~${p.etaMinutes} min)`)
                .join("; ")}.`
            : "User has not shared their location yet.",
          "All values are simulated demo data from a research prototype.",
        ]
          .filter(Boolean)
          .join("\n")}
      />
    </div>
  );
}

