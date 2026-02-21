"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";
import { useTranslations } from "next-intl";

function computeScore(temperature: number, grindSize: number, extractionTime: number): number {
  return Math.max(
    0,
    Math.min(
      100,
      100 -
        Math.abs(205 - temperature) * 0.3 -
        Math.abs(5 - grindSize) * 1.5 -
        Math.abs(28 - extractionTime) * 0.8
    )
  );
}

export default function DigitalTwinPage() {
  const t = useTranslations("digitalTwin");
  const [temperature, setTemperature] = useState(205);
  const [grindSize, setGrindSize] = useState(5);
  const [extractionTime, setExtractionTime] = useState(28);

  const score = useMemo(
    () => computeScore(temperature, grindSize, extractionTime),
    [temperature, grindSize, extractionTime]
  );

  const gaugeData = [{ name: t("quality"), value: score, fill: "rgb(92, 74, 56)" }];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--gray-dark)]">{t("parameters")}</CardTitle>
            <CardDescription>{t("parametersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t("temperature")} ({t("temperatureUnit")})</Label>
                <span className="font-medium text-[var(--foreground)]">{temperature}</span>
              </div>
              <input
                type="range"
                min={180}
                max={230}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-[var(--muted)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t("grindSize")} ({t("grindRange")})</Label>
                <span className="font-medium text-[var(--foreground)]">{grindSize}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={grindSize}
                onChange={(e) => setGrindSize(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-[var(--muted)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t("extractionTime")} ({t("extractionUnit")})</Label>
                <span className="font-medium text-[var(--foreground)]">{extractionTime}</span>
              </div>
              <input
                type="range"
                min={15}
                max={40}
                value={extractionTime}
                onChange={(e) => setExtractionTime(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-[var(--muted)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--gray-dark)]">{t("simulatedQualityScore")}</CardTitle>
            <CardDescription>{t("formula")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div
                className="text-5xl font-bold tabular-nums text-[var(--primary)] transition-all duration-300 sm:text-6xl"
                key={score}
              >
                {score.toFixed(1)}
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="60%"
                    outerRadius="100%"
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={8}
                      animationDuration={400}
                      animationEasing="ease-out"
                    />
                    <Legend content={() => null} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
