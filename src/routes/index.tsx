import { createFileRoute } from "@tanstack/react-router";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import {
  LiveWeatherPanel,
  type PinnedWeatherStatus,
} from "@/components/flood/LiveWeatherPanel";
import { RainfallTimeline } from "@/components/flood/RainfallTimeline";
import { ReportForm } from "@/components/flood/ReportForm";
import { ReportsFeed } from "@/components/flood/ReportsFeed";
import { SummaryCards } from "@/components/flood/SummaryCards";
import { AssistantChat } from "@/components/flood/AssistantChat";
import {
  NearestSafePlace,
  type SafePlaceState,
} from "@/components/flood/NearestSafePlace";
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
import {
  getLocationWeather,
  type LocationWeather,
} from "@/services/weatherService";
import { predictWithML } from "@/services/floodRiskService";

const IndiaMap = lazy(() => import("@/components/flood/IndiaMap"));

const TITLE =
  "Weather Insights — Live Rainfall & Flood Risk Dashboard";

const DESCRIPTION =
  "Weather Insights: live rainfall, satellite and radar data with AI/ML flood-risk prediction for any location in India.";

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

type MLResult = {
  flood: number;
  probability: number;
  risk_level: string;
};

function Dashboard() {
  const model = useFloodModel();

  const [mounted, setMounted] = useState(false);

  const [safeState, setSafeState] = useState<SafePlaceState>({
    coords: null,
    places: [],
    nearestCity: null,
  });

  useEffect(() => setMounted(true), []);

  // ------------------------------------------------------------
  // LIVE LOCATION WEATHER
  // ------------------------------------------------------------

  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [pinnedLocationName, setPinnedLocationName] =
    useState<string | null>(null);

  const [weatherStatus, setWeatherStatus] =
    useState<PinnedWeatherStatus>("loading");

  const [weather, setWeather] =
    useState<LocationWeather | null>(null);

  const [weatherError, setWeatherError] =
    useState<string | null>(null);

  // ------------------------------------------------------------
  // MACHINE LEARNING RESULT
  // ------------------------------------------------------------

  const [mlResult, setMlResult] =
    useState<MLResult | null>(null);

  const [mlStatus, setMlStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const [mlError, setMlError] =
    useState<string | null>(null);

  const weatherRequestRef = useRef(0);

  const weatherAbortRef =
    useRef<AbortController | null>(null);

  // ------------------------------------------------------------
  // LOAD WEATHER + RUN ML
  // ------------------------------------------------------------

  const loadLocationAnalysis = useCallback(
    (lat: number, lng: number) => {
      weatherAbortRef.current?.abort();

      const controller = new AbortController();

      weatherAbortRef.current = controller;

      const requestId =
        ++weatherRequestRef.current;

      setWeatherStatus("loading");
      setWeatherError(null);

      setMlStatus("loading");
      setMlError(null);
      setMlResult(null);

      // --------------------------------------------------------
      // STEP 1 — GET LIVE WEATHER
      // --------------------------------------------------------

      getLocationWeather(
        lat,
        lng,
        controller.signal,
      )
        .then(async (result) => {
          if (
            weatherRequestRef.current !==
            requestId
          ) {
            return;
          }

          setWeather(result);
          setWeatherStatus("ready");

          // ------------------------------------------------------
          // STEP 2 — SEND LIVE WEATHER TO RANDOM FOREST
          // ------------------------------------------------------

          try {
            const ml = await predictWithML({
              latitude: lat,
              longitude: lng,

              rainfall24h:
                result.metrics.next24hMm ?? 0,

              temperature:
                result.current.temperatureC ?? 25,

              humidity:
                result.current.humidityPct ?? 70,

              runoff24h:
                result.metrics.runoff24hMm ?? 0,

              elevationM: result.elevationM ?? 0,
            });

            if (
              weatherRequestRef.current !==
              requestId
            ) {
              return;
            }

            setMlResult(ml);
            setMlStatus("ready");
          } catch (error) {
            if (
              weatherRequestRef.current !==
              requestId
            ) {
              return;
            }

            console.error(
              "ML prediction failed:",
              error,
            );

            setMlStatus("error");

            setMlError(
              error instanceof Error
                ? error.message
                : "ML prediction failed.",
            );
          }
        })
        .catch((err: unknown) => {
          if (
            weatherRequestRef.current !==
            requestId
          ) {
            return;
          }

          if (
            err instanceof DOMException &&
            err.name === "AbortError"
          ) {
            return;
          }

          setWeatherStatus("error");

          setWeatherError(
            err instanceof Error
              ? err.message
              : "Could not load live weather.",
          );

          setMlStatus("error");

          setMlError(
            "ML prediction could not run because live weather data failed.",
          );
        });
    },
    [],
  );

  // ------------------------------------------------------------
  // MAP CLICK / SEARCH
  // ------------------------------------------------------------

  const handleMapClick = useCallback(
    (
      lat: number,
      lng: number,
      name?: string,
    ) => {
      setPinnedLocation({
        lat,
        lng,
      });

      setPinnedLocationName(
        name ??
          String(lat.toFixed(3)) +
            ", " +
            String(lng.toFixed(3)),
      );

      loadLocationAnalysis(lat, lng);
    },
    [loadLocationAnalysis],
  );

  // ------------------------------------------------------------
  // RETRY
  // ------------------------------------------------------------

  const handleRetryWeather =
    useCallback(() => {
      if (!pinnedLocation) return;

      loadLocationAnalysis(
        pinnedLocation.lat,
        pinnedLocation.lng,
      );
    }, [
      pinnedLocation,
      loadLocationAnalysis,
    ]);

  // ------------------------------------------------------------
  // EXISTING DEMO CITY SELECTION
  // ------------------------------------------------------------

  const handleSelectCity = useCallback(
    (id: string) => {
      setPinnedLocation(null);
      setPinnedLocationName(null);

      setMlResult(null);
      setMlStatus("idle");

      model.setSelectedId(id);
    },
    [model.setSelectedId],
  );

  const {
    status,
    offline,
    selected,
  } = model;

  const blocked =
    status === "loading" ||
    status === "error" ||
    !selected;

  return (
    <div className="app-backdrop min-h-screen pb-16">
      <div
        className="app-grid-overlay"
        aria-hidden
      />

      <Header
        scenario={model.scenario}
        tickIso={model.tickIso}
        offline={offline}
        assessments={model.assessments}
      />

      <main className="relative mx-auto mt-5 max-w-[1500px] space-y-4 px-4 sm:px-6">
        {offline ? (
          <div className="glass-panel rounded-2xl p-4">
            <OfflineState
              lastUpdated={clockTime(
                model.tickIso,
              )}
            />
          </div>
        ) : null}

        {/* =====================================================
            1. NATIONAL MAP
        ====================================================== */}

        <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <Panel
            title="National India map"
            subtitle="Search or click any location to analyse live weather and ML flood risk."
            icon={
              <MapPinned className="size-4" />
            }
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
            ) : !mounted ||
              status === "loading" ? (
              <LoadingState label="Initialising map tiles and risk grid…" />
            ) : (
              <Suspense
                fallback={
                  <LoadingState label="Loading map…" />
                }
              >
                <IndiaMap
                  assessments={
                    model.assessments
                  }
                  selectedId={
                    model.selectedId
                  }
                  onSelect={
                    handleSelectCity
                  }
                  showInundation={
                    model.showInundation
                  }
                  onToggleInundation={
                    model.setShowInundation
                  }
                  userLocation={
                    safeState.coords
                  }
                  safePlaces={safeState.places.map(
                    (p) => ({
                      id: p.id,
                      name: p.name,
                      lat: p.lat,
                      lng: p.lng,
                      distanceKm:
                        p.distanceKm,
                    }),
                  )}
                  pinnedLocation={
                    pinnedLocation
                  }
                  onMapClick={
                    handleMapClick
                  }
                />
              </Suspense>
            )}
          </Panel>

          <Panel
            title="Demo Mode controls"
            subtitle="Switch simulated scenarios and exercise loading, error and offline states."
            icon={
              <Settings2 className="size-4" />
            }
          >
            <DemoControls model={model} />
          </Panel>
        </div>

        {/* =====================================================
            2. FORECAST SUMMARY
        ====================================================== */}

        <Panel
          title="Forecast & flood-risk summary"
          subtitle="Ranked by risk score. Every card shows rainfall, depth, onset and confidence."
          icon={
            <LayoutDashboard className="size-4" />
          }
        >
          {status === "error" ? (
            <ErrorState
              message="Could not compute city risk summaries"
              onRetry={model.refresh}
            />
          ) : status === "loading" ? (
            <LoadingState />
          ) : (
            <SummaryCards
              assessments={
                model.assessments
              }
              selectedId={
                model.selectedId
              }
              onSelect={
                handleSelectCity
              }
            />
          )}
        </Panel>

        {/* =====================================================
            NEAREST SAFE PLACE
        ====================================================== */}

        <Panel
          title="Nearest safe place for your current location"
          subtitle="GPS-ranked shelters, raised hospitals, school refuges and high-ground assembly points."
          icon={
            <ShieldCheck className="size-4" />
          }
        >
          <NearestSafePlace
            assessments={model.assessments}
            onLocate={setSafeState}
            onSelectCity={
              handleSelectCity
            }
          />
        </Panel>

        {/* =====================================================
            3. LOCATION DETAILS
        ====================================================== */}

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Selected location details"
            subtitle={
              pinnedLocation
                ? `Live analysis for ${
                    pinnedLocationName ??
                    "selected point"
                  }`
                : "Full prediction record for the selected city."
            }
            icon={
              <Waves className="size-4" />
            }
          >
            {!pinnedLocation ? (
              blocked ? (
                status === "error" ? (
                  <ErrorState
                    message="Location prediction unavailable"
                    onRetry={
                      model.refresh
                    }
                  />
                ) : (
                  <LoadingState />
                )
              ) : (
                <LocationDetails
                  assessment={selected}
                />
              )
            ) : null}

            {pinnedLocation ? (
              <>
                <LiveWeatherPanel
                  coords={pinnedLocation}
                  status={
                    weatherStatus
                  }
                  weather={weather}
                  error={weatherError}
                  onRetry={
                    handleRetryWeather
                  }
                />

                <div className="mt-4 rounded-xl border border-border bg-surface/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        AI / ML Flood Prediction
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Random Forest prediction from live weather features
                      </p>
                    </div>

                    <Brain className="size-5 text-info" />
                  </div>

                  {mlStatus === "loading" ? (
                    <div className="mt-4">
                      <LoadingState label="Running Random Forest prediction…" />
                    </div>
                  ) : mlStatus === "error" ? (
                    <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      {mlError ??
                        "ML prediction unavailable."}
                    </div>
                  ) : mlStatus === "ready" &&
                    mlResult ? (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border bg-surface p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Flood probability
                        </p>

                        <p className="mt-1 text-2xl font-bold text-foreground">
                          {
                            mlResult.probability
                          }
                          %
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Risk level
                        </p>

                        <p className="mt-1 text-2xl font-bold uppercase text-foreground">
                          {
                            mlResult.risk_level
                          }
                        </p>
                      </div>

                      <div className="col-span-2 rounded-lg border border-border bg-surface p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Model decision
                        </p>

                        <p className="mt-1 text-sm text-foreground">
                          {mlResult.flood ===
                          1
                            ? "Flood conditions detected by the model."
                            : "No flood conditions detected by the model."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Select a point on the map to run the ML model.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </Panel>

          {/* ===================================================
              4. RAINFALL TIMELINE
          ==================================================== */}

          <Panel
            title="Rainfall forecast timeline"
            subtitle={
              pinnedLocation
                ? "Live hourly precipitation from Open-Meteo for the pinned point."
                : "3-hourly accumulation with ensemble uncertainty band, next 27 hours."
            }
            icon={
              <CloudRain className="size-4" />
            }
          >
            {pinnedLocation ? (
              weatherStatus ===
              "error" ? (
                <ErrorState
                  message={
                    weatherError ??
                    "Could not load live rainfall data"
                  }
                  onRetry={
                    handleRetryWeather
                  }
                />
              ) : weatherStatus ===
                  "loading" ||
                !weather ? (
                <LoadingState label="Fetching live hourly rainfall from Open-Meteo…" />
              ) : weather.timeline
                  .length === 0 ? (
                <EmptyState
                  title="No forecast hours"
                  description="Open-Meteo returned no hourly precipitation for this window."
                />
              ) : (
                <RainfallTimeline
                  timeline={
                    weather.timeline
                  }
                />
              )
            ) : blocked ? (
              status === "error" ? (
                <ErrorState
                  message="Forecast timeline unavailable"
                  onRetry={
                    model.refresh
                  }
                />
              ) : (
                <LoadingState />
              )
            ) : selected.timeline
                .length === 0 ? (
              <EmptyState
                title="No forecast blocks"
                description="The simulated NWP run returned no rainfall for this window."
              />
            ) : (
              <RainfallTimeline
                timeline={
                  selected.timeline
                }
              />
            )}
          </Panel>
        </div>

        {/* =====================================================
            5. INUNDATION + WHY THIS RISK
        ====================================================== */}

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Predicted inundation layer"
            subtitle="Depth bands used to shade the map footprint."
            icon={
              <BarChart3 className="size-4" />
            }
          >
            {blocked ? (
              status === "error" ? (
                <ErrorState
                  message="Inundation surface unavailable"
                  onRetry={
                    model.refresh
                  }
                />
              ) : (
                <LoadingState />
              )
            ) : selected.inundation
                .length === 0 ? (
              <EmptyState
                title="No inundation predicted"
                description="Modelled depths stay below the 0.1 m reporting threshold for this scenario."
              />
            ) : (
              <InundationPanel
                assessment={selected}
              />
            )}
          </Panel>

          <Panel
            title="Why this risk?"
            subtitle="Explainable contribution of each driver to the current score."
            icon={
              <Brain className="size-4" />
            }
          >
            {blocked ? (
              status === "error" ? (
                <ErrorState
                  message="Explanation unavailable"
                  onRetry={
                    model.refresh
                  }
                />
              ) : (
                <LoadingState />
              )
            ) : (
              <WhyThisRisk
                assessment={selected}
              />
            )}
          </Panel>
        </div>

        {/* =====================================================
            6. DATA SOURCES + REPORTS
        ====================================================== */}

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel
            title="Data sources & data quality"
            subtitle="Adapter slots for satellite, radar, station, NWP and hydrology feeds."
            icon={
              <Database className="size-4" />
            }
          >
            <DataQualityPanel
              offline={offline}
            />
          </Panel>

          <div className="space-y-4">
            <Panel
              title="Citizen flood report"
              subtitle="Crowd observations to complement model output."
              icon={
                <MessageSquarePlus className="size-4" />
              }
            >
              <ReportForm
                defaultLocationId={
                  model.selectedId
                }
                onSubmit={
                  model.addReport
                }
              />
            </Panel>

            <Panel
              title="Recent flood reports"
              subtitle="Newest first · unverified until gauge cross-check."
              icon={
                <Radio className="size-4" />
              }
            >
              <ReportsFeed
                reports={model.reports}
              />
            </Panel>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="glass-panel rounded-2xl px-4 py-4 text-xs leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            {DISCLAIMER}
          </p>

          <p className="mt-1.5">
            Hackathon prototype · live weather + ML
            prediction enabled · basemap ©
            OpenStreetMap contributors · satellite,
            radar, weather and NWP integrations are
            pluggable modules.
          </p>
        </footer>
      </main>

      {/* =======================================================
          AI ASSISTANT CONTEXT
      ======================================================== */}

      <AssistantChat
        context={[
          `Scenario: ${model.scenario}. Updated ${clockTime(
            model.tickIso,
          )} IST.`,

          selected
            ? `Selected city: ${selected.locationId} — risk ${selected.score}/100 (${selected.level}), ${selected.rainfall24hMm} mm/24h, ${selected.rainfall6hMm} mm/6h, predicted depth ${selected.waterDepthM} m, onset in ~${selected.onsetHours} h, confidence ${selected.confidence}%. Advisory: ${selected.advisory}.`
            : "No city selected yet.",

          selected
            ? `Top drivers: ${selected.factors
                .map(
                  (f) =>
                    `${f.label} ${f.contribution}%`,
                )
                .join(", ")}.`
            : "",

          pinnedLocation &&
          mlResult
            ? `Live ML analysis at ${
                pinnedLocationName ??
                "pinned location"
              }: flood probability ${
                mlResult.probability
              }%, risk ${
                mlResult.risk_level
              }, flood ${
                mlResult.flood === 1
                  ? "detected"
                  : "not detected"
              }.`
            : "",

          safeState.places.length
            ? `User's nearest safe places: ${safeState.places
                .map(
                  (p) =>
                    `${p.name} (${p.distanceKm} km ${p.bearing}, ~${p.etaMinutes} min)`,
                )
                .join("; ")}.`
            : "User has not shared their location yet.",

          "The ML prototype uses a Random Forest trained on the synthetic India flood-risk dataset. Live weather values are used as model inputs.",
        ]
          .filter(Boolean)
          .join("\n")}
      />
    </div>
  );
}
