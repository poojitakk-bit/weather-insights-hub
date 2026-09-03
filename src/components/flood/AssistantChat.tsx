import { useEffect, useRef, useState } from "react";
import { Bot, LifeBuoy, Send, Sparkle, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Namaste — I'm Varsha, your flood-safety assistant. Ask me about the current forecast, what the risk score means, when to evacuate, or how to reach the nearest safe place.",
};

const SUGGESTIONS = [
  "Explain the current risk score",
  "Is it safe to travel tonight?",
  "What should I pack in a flood kit?",
];

export function AssistantChat({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING), context }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Assistant unavailable.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply! }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close flood assistant" : "Open flood assistant"}
        className={cn(
          "fixed bottom-5 right-5 z-[900] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-panel transition-transform hover:-translate-y-0.5",
          "bg-primary text-primary-foreground ring-1 ring-info/40",
        )}
      >
        {open ? <X className="size-4" /> : <Bot className="size-4" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask Varsha AI"}</span>
      </button>

      {open ? (
        <div className="glass-panel rise-in fixed bottom-20 right-3 z-[900] flex h-[min(560px,78vh)] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl">
          <header className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-info/15 text-info">
              <LifeBuoy className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground">Varsha · AI flood assistant</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Grounded on the live dashboard context
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {m.role === "assistant" ? (
                  <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-info">
                    <Sparkle className="size-3" /> Varsha
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {busy ? (
              <p className="animate-pulse text-xs text-muted-foreground">Varsha is thinking…</p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-info/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-border/70 p-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about rainfall, risk or evacuation…"
              className="scroll-slim max-h-28 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-info/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
