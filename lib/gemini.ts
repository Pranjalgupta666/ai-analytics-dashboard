const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiMessage {
  role: "user" | "model";
  content: string;
}

export async function geminiChat(
  messages: GeminiMessage[],
  opts: { json?: boolean; systemInstruction?: string } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey and add it to your .env.local file."
    );
  }

  const body: Record<string, unknown> = {
    contents: messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the Gemini API. Check your internet connection.");
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error("Gemini free-tier rate limit hit. Wait a moment and try again.");
    }
    throw new Error(`Gemini API error (${res.status}): ${errText || "unknown error"}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    console.error("Gemini returned no text. finishReason:", finishReason, "raw:", JSON.stringify(data));
    if (finishReason === "MAX_TOKENS") {
      throw new Error("Gemini ran out of output tokens before finishing. Try again.");
    }
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      throw new Error("Gemini declined to respond to this content (safety filter). Try a different question or dataset.");
    }
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}