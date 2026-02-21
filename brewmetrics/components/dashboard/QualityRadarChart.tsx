"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface QualityRadarChartProps {
  data: { subject: string; value: number; fullMark: number }[];
}

const COLORS = {
  fill: "rgba(92, 74, 56, 0.4)",
  stroke: "rgb(92, 74, 56)",
};

const DEFAULT_DATA = [
  { subject: "Acidity", value: 0, fullMark: 100 },
  { subject: "Sweetness", value: 0, fullMark: 100 },
  { subject: "Body", value: 0, fullMark: 100 },
  { subject: "Bitterness", value: 0, fullMark: 100 },
  { subject: "Aroma", value: 0, fullMark: 100 },
  { subject: "Aftertaste", value: 0, fullMark: 100 },
];

export function QualityRadarChart({ data = DEFAULT_DATA }: QualityRadarChartProps) {
  const hasValues = data.some((d) => d.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--gray-dark)]">Quality Profile</CardTitle>
        <CardDescription>
          Sensory attributes (0–100). Add records to see data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke={COLORS.stroke}
                fill={COLORS.fill}
                strokeWidth={2}
                isAnimationActive={hasValues}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [value, "Score"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
