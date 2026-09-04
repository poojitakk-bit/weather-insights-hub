import { createFileRoute } from "@tanstack/react-router";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  messages?: ChatMessage[];
  context?: string;
}

const SYSTEM = `You are "Varsha", the AI flood-safety assistant inside the Weather Insights prototype dashboard.
You help users understand rainfall forecasts, flood-risk scores, predicted inundation depths, evacuation timing and nearest safe places in India.
Rules:
- Be concise (max ~120 words) and practical. Use short markdown-free plain text with simple dashes for lists.
- Use the dashboard context provided to ground your answers, and quote numbers from it when relevant.
- Always remind users this is a research prototype and to follow official NDMA/IMD/local authority instructions for real emergencies when giving safety advice.
- If asked something outside flood/weather/disaster safety, answer briefly and steer back.`;

function errorMessage(status: number) {
  if (status === 429) return "Too many requests right now — please wait a moment and try again.";
  if (status === 402) return "AI credits are exhausted for this workspace. Add credits to continue.";
  if (status === 403) return "AI access is blocked for this workspace.";
  return `Assistant unavailable (${status}).`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as Body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return Response.json({ error: "messages required" }, { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
        }

        const input = [
          { role: "system", content: SYSTEM },
          ...(context ? [{ role: "system", content: `Dashboard context:\n${context}` }] : []),
          ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        ];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            input,
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
          }),
        });

        if (!res.ok || !res.body) {
          const text = res.ok ? "no body" : await res.text();
          console.error(`AI gateway error [${res.status}]: ${text}`);
          return Response.json({ error: errorMessage(res.status) }, { status: res.ok ? 500 : res.status });
        }

        // Consume the SSE stream server-side and return the final text.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let reply = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload) as {
                type?: string;
                delta?: string;
                response?: { output_text?: string };
              };
              if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
                reply += evt.delta;
              } else if (evt.type === "response.completed" && !reply) {
                reply = evt.response?.output_text ?? "";
              }
            } catch {
              // ignore keep-alive / non-JSON frames
            }
          }
        }

        return Response.json({
          reply: reply.trim() || "I couldn't generate an answer for that — please rephrase.",
        });
      },
    },
  },
});
