import { createFileRoute } from "@tanstack/react-router";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  messages?: ChatMessage[];
  context?: string;
}

const SYSTEM = `You are "Varsha", the AI flood-safety assistant inside the India Flood Intelligence prototype dashboard.
You help users understand rainfall forecasts, flood-risk scores, predicted inundation depths, evacuation timing and nearest safe places in India.
Rules:
- Be concise (max ~120 words) and practical. Use short markdown-free plain text with simple dashes for lists.
- Use the dashboard context provided to ground your answers, and quote numbers from it when relevant.
- Always remind users this is a research prototype and to follow official NDMA/IMD/local authority instructions for real emergencies when giving safety advice.
- If asked something outside flood/weather/disaster safety, answer briefly and steer back.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as Body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response(JSON.stringify({ error: "messages required" }), { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), { status: 500 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM },
              ...(context ? [{ role: "system", content: `Dashboard context:\n${context}` }] : []),
              ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
            ],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          const message =
            res.status === 429
              ? "Too many requests right now — please wait a moment and try again."
              : res.status === 402
                ? "AI credits are exhausted for this workspace. Add credits to continue."
                : `Assistant unavailable (${res.status}).`;
          console.error(`AI gateway error [${res.status}]: ${text}`);
          return new Response(JSON.stringify({ error: message }), { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content ?? "No response generated.";
        return new Response(JSON.stringify({ reply }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
