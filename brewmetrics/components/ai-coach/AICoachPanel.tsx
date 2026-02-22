"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Sparkles } from "lucide-react";

type CoachContext = "brew" | "roast";

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

interface AICoachPanelProps {
  context: CoachContext;
  entries: CoachEntry[];
}

export function AICoachPanel({ context, entries }: AICoachPanelProps) {
  const t = useTranslations("aiCoach");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);

  async function handleGetAdvice() {
    if (entries.length === 0) return;
    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          locale,
          entries,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setAdvice(data.advice ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--gray-dark)]">
          <Bot className="h-5 w-5 text-[var(--primary)]" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {context === "brew" ? t("descriptionBrew") : t("descriptionRoast")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleGetAdvice}
          disabled={loading || entries.length === 0}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t("button")}
            </>
          )}
        </Button>

        {entries.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">{t("noData")}</p>
        )}

        {error && <p className="text-sm text-rose-700">{error}</p>}

        {advice && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--cream-muted)]/50 p-4">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{advice}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
