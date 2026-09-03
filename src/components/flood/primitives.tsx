import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "glass-panel panel-lift group/panel relative flex flex-col overflow-hidden rounded-2xl hover:panel-lift-hover",
        className,
      )}
    >
      <span className="panel-edge" aria-hidden />
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-info">
              {icon}
            </span>
          ) : null}
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 font-display text-lg leading-tight text-foreground", accent)}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading model output…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Loader2 className="size-6 animate-spin text-info" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="w-full max-w-sm space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 animate-pulse rounded-full bg-surface-raised/70" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-8 text-center">
      <AlertTriangle className="size-6 text-danger" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="max-w-md text-xs text-muted-foreground">
        The simulated pipeline reported a failure. Retry, or switch scenario in Demo Mode controls.
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-lg border border-danger/40 bg-danger/20 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-danger/30"
        >
          Retry pipeline
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function OfflineState({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-8 text-center">
      <WifiOff className="size-6 text-amber" />
      <p className="text-sm font-medium text-foreground">Offline — showing cached demo data</p>
      <p className="max-w-md text-xs text-muted-foreground">
        No connection to the prediction service.
        {lastUpdated ? ` Cached snapshot from ${lastUpdated}.` : ""} Values will refresh when
        connectivity returns.
      </p>
    </div>
  );
}
