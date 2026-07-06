import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, DatasetProfile } from "@/lib/types";
import { geminiChat } from "@/lib/gemini";

function buildSystemPrompt(profile: DatasetProfile, fileName: string): string {
  const columnSummaries = profile.columns
    .map((c) => {
      const bits: string[] = [`${c.name} (${c.type})`];
      if (c.type === "number") {
        bits.push(`min=${c.min?.toFixed(2)} max=${c.max?.toFixed(2)} mean=${c.mean?.toFixed(2)} sum=${c.sum?.toFixed(2)}`);
      }
      if (c.type === "category" && c.topValues) {
        bits.push(`top values: ${c.topValues.map((t) => `${t.value}(${t.count})`).join(", ")}`);
      }
      return bits.join(" — ");
    })
    .join("\n");

  const timeSeriesSummary = (profile.timeSeries ?? [])
    .map((ts) => `${ts.column} over time: ${ts.points.map((p) => `${p.label}=${p.value.toFixed(1)}`).join(", ")}`)
    .join("\n");

  const categorySummary = (profile.categoryBreakdowns ?? [])
    .map((cb) => `${cb.column} by ${profile.primaryCategoryColumn}: ${cb.points.map((p) => `${p.label}=${p.value.toFixed(1)}`).join(", ")}`)
    .join("\n");

  return `You are a business data analyst answering questions about a dataset from "${fileName}" (${profile.rowCount} rows).

Only use the data below to answer. If the answer cannot be determined from this data, say so plainly instead of guessing or inventing numbers.

COLUMNS:
${columnSummaries}

${timeSeriesSummary ? `TIME SERIES:\n${timeSeriesSummary}\n` : ""}
${categorySummary ? `CATEGORY BREAKDOWNS:\n${categorySummary}\n` : ""}

Answer in 1-3 concise sentences. No markdown headers, no preamble like "Based on the data".`;
}

export async function POST(req: NextRequest) {
  try {
    const { profile, fileName, messages } = (await req.json()) as {
      profile: DatasetProfile;
      fileName: string;
      messages: ChatMessage[];
    };

    if (!profile || !messages?.length) {
      return NextResponse.json({ error: "Missing profile or messages." }, { status: 400 });
    }

    // Gemini uses "model" instead of "assistant" for the AI's turns.
    const geminiMessages = messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      content: m.content,
    }));

    const answer = await geminiChat(geminiMessages, {
      systemInstruction: buildSystemPrompt(profile, fileName ?? "uploaded file"),
    });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Ask route error:", err);
    const message = err instanceof Error ? err.message : "Failed to get an answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
