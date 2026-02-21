"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from "recharts";

interface DataPoint {
  roast_temperature: number;
  cupping_score: number;
  name?: string;
}

interface AdvancedAnalyticsScatterProps {
  data: DataPoint[];
}

export function AdvancedAnalyticsScatter({ data }: AdvancedAnalyticsScatterProps) {
  const chartData = data.map((d) => ({
    x: d.roast_temperature,
    y: d.cupping_score,
    name: d.name ?? `${d.roast_temperature}°C`,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--gray-dark)]">Advanced Analytics</CardTitle>
          <CardDescription>Roast temperature vs cupping score</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center text-sm text-[var(--muted-foreground)]">
          Add roasting records with temperature and cupping score to see the correlation.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--gray-dark)]">Advanced Analytics</CardTitle>
        <CardDescription>
          Roast temperature vs cupping score — stable temperatures typically improve quality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Roast temp"
                unit="°C"
                domain={["dataMin - 5", "dataMax + 5"]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Cupping score"
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis range={[80, 200]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string) => [
                  name === "Roast temp" ? `${value}°C` : value,
                  name,
                ]}
                labelFormatter={() => ""}
              />
              <Legend />
              <Scatter
                name="Batch"
                data={chartData}
                fill="rgb(92, 74, 56)"
                fillOpacity={0.8}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
