import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { LOCATIONS, RISK_LEVEL_META } from "@/lib/flood/mock-data";
import type { CitizenReport, RiskLevel } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

const DEPTHS = [
  "Below ankle (<0.2 m)",
  "Ankle to knee (0.2–0.5 m)",
  "Knee to waist (0.5–1.0 m)",
  "Above waist (>1.0 m)",
];

const LEVELS: RiskLevel[] = ["low", "moderate", "high", "severe"];

export function ReportForm({
  defaultLocationId,
  onSubmit,
}: {
  defaultLocationId: string;
  onSubmit: (r: CitizenReport) => void;
}) {
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [severity, setSeverity] = useState<RiskLevel>("moderate");
  const [depth, setDepth] = useState(DEPTHS[1]!);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError("Please describe what you are seeing in at least 10 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const loc = LOCATIONS.find((l) => l.id === locationId)!;
      onSubmit({
        id: `r-${Date.now()}`,
        locationId,
        city: loc.city,
        severity,
        waterDepthLabel: depth,
        description: description.trim(),
        reportedAt: new Date().toISOString(),
        verified: false,
        reporter: "You (demo)",
      });
      setDescription("");
      setSubmitting(false);
      toast.success("Report added to the demo feed", {
        description: "Stored locally only — nothing is sent to any authority.",
      });
    }, 600);
  };

  const field =
    "w-full rounded-xl border border-input bg-surface/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-info/60 focus:ring-2 focus:ring-ring/30";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Location</span>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={cn(field, "mt-1")}
          >
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.city}, {l.state}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Observed water depth</span>
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className={cn(field, "mt-1")}
          >
            {DEPTHS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="text-xs font-medium text-muted-foreground">Severity</span>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setSeverity(l)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                severity === l
                  ? "border-info/50 bg-info/20 text-info"
                  : "border-border bg-surface/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {RISK_LEVEL_META[l].label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">What are you seeing?</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Street, landmark, how fast water is rising, road blocked…"
          className={cn(field, "mt-1 resize-none")}
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Demo only — reports stay in your browser session.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-amber-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Send className="size-4" />
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
