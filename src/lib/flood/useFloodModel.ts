import { useCallback, useEffect, useMemo, useState } from "react";

import { LOCATIONS, SEED_REPORTS, buildAssessments } from "./mock-data";
import type { CitizenReport, RiskAssessment, ScenarioId } from "./types";

export type PipelineStatus = "loading" | "ready" | "error";

export interface FloodModel {
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  status: PipelineStatus;
  offline: boolean;
  setOffline: (v: boolean) => void;
  forceError: boolean;
  setForceError: (v: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  showInundation: boolean;
  setShowInundation: (v: boolean) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  assessments: Record<string, RiskAssessment>;
  selected: RiskAssessment | undefined;
  reports: CitizenReport[];
  addReport: (r: CitizenReport) => void;
  refresh: () => void;
  tickIso: string;
}

export function useFloodModel(): FloodModel {
  const [scenario, setScenarioState] = useState<ScenarioId>("monsoon");
  const [status, setStatus] = useState<PipelineStatus>("loading");
  const [offline, setOffline] = useState(false);
  const [forceError, setForceError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showInundation, setShowInundation] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("mumbai");
  // Keep the first server and browser render identical. The initial model run
  // replaces this bootstrap timestamp with the current time after hydration.
  const [tickIso, setTickIso] = useState<string>("2026-01-01T00:00:00.000Z");
  const [reports, setReports] = useState<CitizenReport[]>(SEED_REPORTS);

  const run = useCallback(() => {
    setStatus("loading");
    const t = setTimeout(() => {
      setTickIso(new Date().toISOString());
      setStatus(forceError ? "error" : "ready");
    }, 700);
    return () => clearTimeout(t);
  }, [forceError]);

  useEffect(() => run(), [run, scenario]);

  useEffect(() => {
    if (!autoRefresh || offline || status === "error") return;
    const id = setInterval(() => setTickIso(new Date().toISOString()), 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, offline, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if (!navigator.onLine) setOffline(true);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const assessments = useMemo(() => buildAssessments(scenario, tickIso), [scenario, tickIso]);

  const setScenario = useCallback((s: ScenarioId) => setScenarioState(s), []);
  const addReport = useCallback((r: CitizenReport) => setReports((prev) => [r, ...prev]), []);

  return {
    scenario,
    setScenario,
    status,
    offline,
    setOffline,
    forceError,
    setForceError,
    autoRefresh,
    setAutoRefresh,
    showInundation,
    setShowInundation,
    selectedId,
    setSelectedId,
    assessments,
    selected: assessments[selectedId],
    reports,
    addReport,
    refresh: run,
    tickIso,
  };
}

export const ALL_LOCATIONS = LOCATIONS;
