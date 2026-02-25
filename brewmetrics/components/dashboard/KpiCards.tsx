"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Coffee, Star, Hash, BarChart3 } from "lucide-react";

interface KpiCardsProps {
  totalRecords: number;
  avgCupping: number | null;
  recentTrend: "up" | "down" | "neutral";
}

export function KpiCards({ totalRecords, avgCupping, recentTrend }: KpiCardsProps) {
  const t = useTranslations("dashboard");
  const trendLabel =
    recentTrend === "up" ? t("improving") : recentTrend === "down" ? t("declining") : t("stable");
  const kpis = [
    {
      title: t("totalRecords"),
      value: String(totalRecords),
      sub: `${totalRecords} ${t("totalRecordsSub")}`,
      icon: Hash,
    },
    {
      title: t("averageCuppingScore"),
      value: avgCupping != null ? avgCupping.toFixed(1) : "—",
      sub: t("averageCuppingScoreSub"),
      icon: Star,
    },
    { title: t("batchesTracked"), value: String(totalRecords), sub: t("batchesTrackedSub"), icon: Coffee },
    { title: t("qualityTrend"), value: trendLabel, sub: t("trendSub"), icon: BarChart3 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card
          key={kpi.title}
          className="overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">
              {kpi.title}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]">
              <kpi.icon className="h-4 w-4 text-[var(--primary)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
              {kpi.value}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{kpi.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
