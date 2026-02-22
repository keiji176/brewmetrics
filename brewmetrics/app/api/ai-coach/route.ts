import Anthropic from "@anthropic-ai/sdk";
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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on server." },
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

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt =
      locale === "ja"
        ? "あなたはプロのバリスタ兼抽出コーチです。必ず安全で実践的な提案を日本語で返してください。出力は2〜4文、簡潔に。具体的に次回試す調整値を1つ以上入れてください。"
        : "You are a professional barista and brew coach. Return concise, practical advice in 2-4 sentences. Include at least one concrete next adjustment value for the next brew.";

    const userPrompt = JSON.stringify({ context, entries }, null, 2);

    const requestPayload = {
      max_tokens: 240,
      temperature: 0.4,
      system: systemPrompt,
      messages: [
        {
          role: "user" as const,
          content:
            (locale === "ja"
              ? "以下の記録データを分析し、次回もっと美味しくするための具体的アドバイスをください。"
              : "Analyze the following records and give concrete suggestions for the next better cup.") +
            "\n\n" +
            userPrompt,
        },
      ],
    };

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        ...requestPayload,
      });
    } catch (modelError) {
      const message = modelError instanceof Error ? modelError.message : String(modelError);
      const isModelNotFound =
        message.includes("not_found_error") && message.includes("model:");

      if (!isModelNotFound) {
        throw modelError;
      }

      response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        ...requestPayload,
      });
    }

    const advice = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    if (!advice) {
      return NextResponse.json(
        { error: "Failed to generate advice." },
        { status: 502 }
      );
    }

    return NextResponse.json({ advice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
