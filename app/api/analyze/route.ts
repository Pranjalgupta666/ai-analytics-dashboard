import { NextRequest, NextResponse } from "next/server";
import { DatasetProfile } from "@/lib/types";
import { geminiChat } from "@/lib/gemini";

function buildPrompt(profile: DatasetProfile, fileName: string): string {
  const columnSummaries = profile.columns
    .map((c) => {
      const bits: string[] = [`- ${c.name} (${c.type})`];
      if (c.type === "number") {
        bits.push(
          `min=${c.min?.toFixed(2)}, max=${c.max?.toFixed(2)}, mean=${c.mean?.toFixed(2)}, sum=${c.sum?.toFixed(2)}`
        );
      }
      if (c.type === "category" && c.topValues) {
        bits.push(
          `top values: ${c.topValues.map((t) => `${t.value} (${t.count})`).join(", ")}`
        );
      }
      if (c.missingCount > 0) bits.push(`${c.missingCount} missing values`);
      return bits.join(" — ");
    })
    .join("\n");

  const timeSeriesSummary = (profile.timeSeries ?? [])
    .map((ts) => {
      const points = ts.points.slice(0, 30);
      return `${ts.column} over time: ${points.map((p) => `${p.label}=${p.value.toFixed(1)}`).join(", ")}`;
    })
    .join("\n");

  const categorySummary = (profile.categoryBreakdowns ?? [])
    .map((cb) => {
      return `${cb.column} by ${profile.primaryCategoryColumn}: ${cb.points
        .map((p) => `${p.label}=${p.value.toFixed(1)}`)
        .join(", ")}`;
    })
    .join("\n");

  return `You are a business data analyst. Analyze this dataset summary (derived from a file called "${fileName}" with ${profile.rowCount} rows) and produce insights.

COLUMN PROFILE:
${columnSummaries}

${timeSeriesSummary ? `TIME SERIES AGGREGATES:\n${timeSeriesSummary}\n` : ""}
${categorySummary ? `CATEGORY BREAKDOWNS:\n${categorySummary}\n` : ""}

Respond with ONLY a JSON object (no markdown fences, no preamble) matching this exact shape:
{
  "headline": "one short sentence, the single most important takeaway",
  "summary": "2-3 sentence plain-English executive summary",
  "trends": ["short trend statement", "..."],
  "anomalies": ["short anomaly or outlier statement, or empty array if none found"],
  "recommendations": ["short, actionable recommendation", "..."]
}

Ground every statement in the numbers provided above. Do not invent figures that are not derivable from the data given. Keep each array to 2-4 items.`;
}

export async function POST(req: NextRequest) {
  try {
    const { profile, fileName } = (await req.json()) as {
      profile: DatasetProfile;
      fileName: string;
    };

    if (!profile) {
      return NextResponse.json({ error: "Missing dataset profile." }, { status: 400 });
    }

    const raw = await geminiChat(
      [{ role: "user", content: buildPrompt(profile, fileName ?? "uploaded file") }],
      { json: true }
    );

    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Small local models sometimes wrap JSON in stray text — try to
      // extract just the {...} block before giving up.
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fall through to error response below
        }
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "AI response could not be parsed. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ insight: parsed });
  } catch (err) {
    console.error("Analyze route error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate insights.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
