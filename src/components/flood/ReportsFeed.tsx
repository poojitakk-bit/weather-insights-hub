```tsx
import { BadgeCheck, Clock3, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { RISK_LEVEL_META } from "@/lib/flood/mock-data";
import { levelClasses, timeAgo } from "@/lib/flood/format";
import type { CitizenReport } from "@/lib/flood/types";
import { EmptyState } from "@/components/flood/primitives";
import { cn } from "@/lib/utils";

function ClientTimeAgo({
  reportedAt,
}: {
  reportedAt: string | number | Date;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(timeAgo(reportedAt));
  }, [reportedAt]);

  return <>{text || "Recently"}</>;
}

export function ReportsFeed({
  reports,
}: {
  reports: CitizenReport[];
}) {
  if (reports.length === 0) {
    return (
      <EmptyState
        title="No citizen reports yet"
        description="Submit a report using the form to see it appear in this feed."
      />
    );
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-auto pr-1 scroll-slim">
      {reports.map((r) => {
        const c = levelClasses[r.severity];

        return (
          <li
            key={r.id}
            className="rounded-xl border border-border bg-surface/40 px-3 py-2.5 transition-colors hover:bg-surface/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MapPin className="size-3.5 text-info" />
                {r.city}
              </span>

              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  c.badge,
                )}
              >
                {RISK_LEVEL_META[r.severity].label}
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {r.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{r.waterDepthLabel}</span>

              <span className="flex items-center gap-1">
                <Clock3 className="size-3" />
                <ClientTimeAgo reportedAt={r.reportedAt} />
              </span>

              <span className="flex items-center gap-1">
                <BadgeCheck
                  className={cn(
                    "size-3",
                    r.verified
                      ? "text-safe"
                      : "text-muted-foreground",
                  )}
                />
                {r.verified
                  ? "Cross-checked with gauge"
                  : "Unverified"}
              </span>

              <span>{r.reporter}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```
