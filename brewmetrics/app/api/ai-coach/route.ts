import { google } from "@ai-sdk/google";
import { streamText } from "ai";
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
        ? "あなたは専属のプロフェッショナル・バリスタコーチです。提供されたユーザーのコーヒー抽出記録（豆の品種、挽き目、湯温、粉量、注湯量、時間、スコアなど）を分析し、次の一杯をより美味しくするための具体的な改善アクションを提案してください。出力は必ず自然な日本語の文章（Markdown形式）で、1行目から次の2つの見出しをこの順番で含めてください：『☕️ 今回の抽出の分析』『💡 次の一杯への具体的な提案』。冒頭の挨拶文は不要です。提案パートでは、ユーザーが次回すぐ試せる具体的な数値（例：湯温±1℃、時間±5〜10秒、挽き目1段階）を必ず1つ以上含めてください。JSON形式（例：{\"advice\":\"...\"}）、キー名、コードブロック、機械的なフォーマットは絶対に出力しないでください。"
        : "You are a dedicated professional barista coach. Analyze the provided brew records and give practical actions for the next cup. Output must be plain natural-language text (Markdown allowed), start on the first line with these exact headings in order: '☕️ Brew Analysis' then '💡 Concrete Next-Brew Actions'. Do not include greetings. In the action section, always include at least one immediately testable numeric adjustment (for example: water temperature ±1°C, brew time ±5-10s, or one grind step). Never output JSON, object keys, or code blocks.";

    const userPrompt = JSON.stringify({ context, entries }, null, 2);

    const promptText =
      (locale === "ja"
        ? "以下の記録データを分析し、次回もっと美味しくするための具体的アドバイスをください。"
        : "Analyze the following records and give concrete suggestions for the next better cup.") +
      "\n\n" +
      userPrompt;

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
    ] as const;

    let advice = "";
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const result = streamText({
          model: google(modelName),
          system: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 420,
          prompt: promptText,
        });

        return result.toTextStreamResponse({
          headers: {
            "Cache-Control": "no-cache",
          },
        });
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return NextResponse.json(
      { error: "Failed to generate advice." },
      { status: 502 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
