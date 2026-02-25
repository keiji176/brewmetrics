"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoastingRecordRow } from "@/lib/supabase/types";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { QualityRadarChart } from "@/components/dashboard/QualityRadarChart";
import { QualityTrendChart } from "@/components/dashboard/QualityTrendChart";
import { AdvancedAnalyticsScatter } from "@/components/dashboard/AdvancedAnalyticsScatter";
import { AICoachPanel } from "@/components/ai-coach/AICoachPanel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

function useRoastingRecords() {
  const [records, setRecords] = useState<RoastingRecordRow[]>([]);
  const [hasBeans, setHasBeans] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }
    Promise.all([
      supabase
        .from("roasting_records")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase.from("bean_profiles").select("id").limit(1),
    ]).then(([roastingRes, beanRes]) => {
      setLoading(false);

      if (roastingRes.error) {
        setError(roastingRes.error.message);
        return;
      }

      setRecords((roastingRes.data as RoastingRecordRow[]) ?? []);
      setHasBeans((beanRes.data?.length ?? 0) > 0);
    });
  }, [supabase]);

  return { records, hasBeans, loading, error };
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { records, hasBeans, loading, error } = useRoastingRecords();

  const totalRecords = records.length;
  const scores = records.map((r) => r.cupping_score).filter((s): s is number => s != null);
  const avgCupping = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const trendData = (() => {
    const byDate: Record<string, number[]> = {};
    records.forEach((r) => {
      if (r.cupping_score == null) return;
      const d = new Date(r.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(r.cupping_score);
    });
    return Object.entries(byDate)
      .map(([date, vals]) => ({
        date,
        score: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const scatterData = records
    .filter(
      (r): r is RoastingRecordRow & { roast_temperature: number; cupping_score: number } =>
        r.roast_temperature != null && r.cupping_score != null
    )
    .map((r) => ({
      roast_temperature: r.roast_temperature,
      cupping_score: r.cupping_score,
      name: r.bean_name ?? undefined,
    }));

  const recentTrend: "up" | "down" | "neutral" =
    trendData.length >= 2
      ? trendData[trendData.length - 1].score > trendData[trendData.length - 2].score
        ? "up"
        : trendData[trendData.length - 1].score < trendData[trendData.length - 2].score
          ? "down"
          : "neutral"
      : "neutral";

  const radarData = [
    { subject: t("radarAcidity"), value: 0, fullMark: 100 },
    { subject: t("radarSweetness"), value: 0, fullMark: 100 },
    { subject: t("radarBody"), value: 0, fullMark: 100 },
    { subject: t("radarBitterness"), value: 0, fullMark: 100 },
    { subject: t("radarAroma"), value: 0, fullMark: 100 },
    { subject: t("radarAftertaste"), value: 0, fullMark: 100 },
  ];
  if (avgCupping != null && avgCupping > 0) {
    const v = Math.round(avgCupping * 0.9);
    radarData.forEach((d, i) => {
      radarData[i].value = Math.min(100, v + (i % 3) - 1);
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            {t("title")}
          </h1>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-sm text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  const ctaHref = hasBeans ? "/brew-records" : "/bean-profiles";
  const ctaTitle = hasBeans ? t("ctaTitleHasBeans") : t("ctaTitleNoBeans");
  const ctaDescription = hasBeans ? t("ctaDescHasBeans") : t("ctaDescNoBeans");
  const ctaButton = hasBeans ? t("ctaButtonRecord") : t("ctaButtonRegister");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>

      <section className="min-h-[42vh] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-5">
          <p className="text-sm font-semibold text-[var(--primary)]">{t("ctaLead")}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)] sm:text-3xl">
            {ctaTitle}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {ctaDescription}
          </p>
          <div>
            <Link href={ctaHref}>
              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                {ctaButton}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-8 pt-8">
        <KpiCards
          totalRecords={totalRecords}
          avgCupping={avgCupping}
          recentTrend={recentTrend}
        />

        <AICoachPanel context="roast" entries={records} />

        <div className="grid gap-6 lg:grid-cols-2">
          <QualityRadarChart data={radarData} />
          <QualityTrendChart data={trendData} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--gray-dark)]">
            {t("advancedAnalytics")}
          </h2>
          <AdvancedAnalyticsScatter data={scatterData} />
        </div>
      </section>
    </div>
  );
}
