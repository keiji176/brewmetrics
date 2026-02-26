import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CoachEntry = {
  bean_name?: string | null;
  roaster?: string | null;
  grind_size?: string | null;
  temperature?: number | null;
  roast_temperature?: number | null;
  brew_time?: number | null;
  extraction_time?: number | null;
  score?: number | null;
  cupping_score?: number | null;
  notes?: string | null;
  created_at?: string | null;
};

function normalizeEntry(entry: CoachEntry) {
  return {
    bean_name: entry.bean_name ?? "",
    roaster: entry.roaster ?? "",
    grind_size: entry.grind_size ?? "",
    temperature: entry.temperature ?? entry.roast_temperature ?? null,
    brew_time: entry.brew_time ?? entry.extraction_time ?? null,
    score: entry.score ?? entry.cupping_score ?? null,
    notes: entry.notes ?? "",
    created_at: entry.created_at ?? "",
  };
}

function isModelUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("is not found for API version") ||
    message.includes("is not supported for generateContent") ||
    message.includes("models/")
  );
}

async function resolveAvailableModel(modelCandidates: string[]) {
  let lastError: unknown;

  for (const modelName of modelCandidates) {
    try {
      await generateText({
        model: google(modelName),
        maxTokens: 1,
        temperature: 0,
        prompt: "ping",
      });
      return modelName;
    } catch (error) {
      lastError = error;
      if (!isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No available Gemini model found for generateContent.");
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set on server." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as {
      locale?: "en" | "ja";
      context?: "brew" | "roast";
      entries?: CoachEntry[];
    };

    const locale = body.locale === "ja" ? "ja" : "en";
    const context = body.context === "roast" ? "roast" : "brew";
    const entries = (body.entries ?? []).slice(-8).map(normalizeEntry);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No records provided for analysis." },
        { status: 400 }
      );
    }

    const systemPrompt =
      locale === "ja"
        ? "あなたはプロのバリスタ兼抽出コーチです。必ず安全で実践的な提案を日本語で返してください。出力は2〜4文、簡潔に。具体的に次回試す調整値を1つ以上入れてください。"
        : "You are a professional barista and brew coach. Return concise, practical advice in 2-4 sentences. Include at least one concrete next adjustment value for the next brew.";

    const userPrompt = JSON.stringify({ context, entries }, null, 2);

    const prompt =
      (locale === "ja"
        ? "以下の記録データを分析し、次回もっと美味しくするための具体的アドバイスをください。"
        : "Analyze the following records and give concrete suggestions for the next better cup.") +
      "\n\n" +
      userPrompt;

    const preferredModel = process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim();
    const modelCandidates = [
      preferredModel,
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.0-pro",
    ].filter((modelName): modelName is string => Boolean(modelName));

    const modelName = await resolveAvailableModel(modelCandidates);

    const result = streamText({
      model: google(modelName),
      maxTokens: 240,
      temperature: 0.4,
      system: systemPrompt,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
