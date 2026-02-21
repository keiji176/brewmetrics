"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";

interface TrendPoint {
  date: string;
  score: number;
  target?: number;
}

interface QualityTrendChartProps {
  data: TrendPoint[];
}

export function QualityTrendChart({ data }: QualityTrendChartProps) {
  const t = useTranslations("dashboard");
  const hasData = data.length > 0;
  const target = 85;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--gray-dark)]">{t("qualityTrendChart")}</CardTitle>
        <CardDescription>{t("qualityTrendChartDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hasData ? data : [{ date: "No data", score: 0 }]}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(92, 74, 56)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(92, 74, 56)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                domain={hasData ? ["auto", "auto"] : [0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [value.toFixed(1), t("score")]}
                labelFormatter={(label) => (label ? `Date: ${label}` : "")}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="rgb(92, 74, 56)"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                isAnimationActive={hasData}
                animationDuration={500}
                animationEasing="ease-out"
              />
              {hasData && (
                <ReferenceLine
                  y={target}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: t("target"), position: "right" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
