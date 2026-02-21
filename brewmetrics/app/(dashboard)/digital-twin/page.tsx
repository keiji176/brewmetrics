"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";

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
  const [temperature, setTemperature] = useState(205);
  const [grindSize, setGrindSize] = useState(5);
  const [extractionTime, setExtractionTime] = useState(28);

  const score = useMemo(
    () => computeScore(temperature, grindSize, extractionTime),
    [temperature, grindSize, extractionTime]
  );

  const gaugeData = [{ name: "Quality", value: score, fill: "rgb(92, 74, 56)" }];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          Live Coffee Digital Twin
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Interactive simulation — adjust parameters and see quality score in real time (no AI, pure formula)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--gray-dark)]">Parameters</CardTitle>
            <CardDescription>
              Temperature 180–230°C · Grind 1–10 · Extraction 15–40s
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Temperature (°C)</Label>
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
                <Label>Grind Size (1–10)</Label>
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
                <Label>Extraction Time (s)</Label>
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
            <CardTitle className="text-[var(--gray-dark)]">Simulated Quality Score</CardTitle>
            <CardDescription>Formula: 100 − |205−T|×0.3 − |5−G|×1.5 − |28−E|×0.8</CardDescription>
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
