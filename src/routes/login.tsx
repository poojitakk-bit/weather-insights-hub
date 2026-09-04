import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck, Waves } from "lucide-react";
import { useState } from "react";

const TITLE = "Sign in — Weather Insights";
const DESCRIPTION =
  "Sign in to the Weather Insights dashboard to save locations and view live rainfall and flood-risk insights.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      window.localStorage.setItem("wi.demo.user", JSON.stringify({ email, at: Date.now() }));
    } catch {
      /* storage unavailable */
    }
    void navigate({ to: "/" });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-0 size-[420px] rounded-full bg-info/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-[380px] rounded-full bg-primary/20 blur-3xl" />

      <div className="glass-panel relative w-full max-w-md rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/20 ring-1 ring-inset ring-border">
            <Waves className="size-6 text-info" />
          </span>
          <div>
            <h1 className="font-display text-xl leading-tight">
              <span className="text-gradient-flood">Weather Insights</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "signin" ? "Sign in to your dashboard" : "Create your account"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-info/50 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-info/50 focus:outline-none"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            <LogIn className="size-4" />
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
          }}
          className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-[11px] leading-relaxed text-amber">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Demo sign-in only — no account server is connected yet, so credentials stay in this
          browser and nothing is sent anywhere.
        </p>

        <Link
          to="/"
          className="mt-4 block text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Continue to the dashboard without signing in
        </Link>
      </div>
    </main>
  );
}
