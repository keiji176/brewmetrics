"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrinderCalibrationRow } from "@/lib/supabase/types";
import { GrindSize } from "@/lib/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        Math.abs(3 - grindSize) * 3 -
        Math.abs(28 - extractionTime) * 0.8
    )
  );
}

const grindScale = [
  { value: 1, key: GrindSize.FINE },
  { value: 2, key: GrindSize.MEDIUM_FINE },
  { value: 3, key: GrindSize.MEDIUM },
  { value: 4, key: GrindSize.MEDIUM_COARSE },
  { value: 5, key: GrindSize.COARSE },
] as const;

function estimateGrindSizeByClick(calibration: GrinderCalibrationRow, click: number): GrindSize {
  const pairs: Array<{ size: GrindSize; click: number }> = [
    { size: GrindSize.FINE, click: calibration.fine_click },
    { size: GrindSize.MEDIUM_FINE, click: calibration.medium_fine_click },
    { size: GrindSize.MEDIUM, click: calibration.medium_click },
    { size: GrindSize.MEDIUM_COARSE, click: calibration.medium_coarse_click },
    { size: GrindSize.COARSE, click: calibration.coarse_click },
  ];

  return pairs.reduce((best, current) => {
    const currentDiff = Math.abs(current.click - click);
    const bestDiff = Math.abs(best.click - click);
    return currentDiff < bestDiff ? current : best;
  }).size;
}

export default function DigitalTwinPage() {
  const t = useTranslations("digitalTwin");
  const supabase = createClient();

  const [temperature, setTemperature] = useState(205);
  const [manualGrindSize, setManualGrindSize] = useState<GrindSize>(GrindSize.MEDIUM);
  const [extractionTime, setExtractionTime] = useState(28);
  const [userId, setUserId] = useState<string | null>(null);
  const [calibrations, setCalibrations] = useState<GrinderCalibrationRow[]>([]);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState("");
  const [clickInput, setClickInput] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase
      .from("grinder_calibrations")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return;
        const rows = (data as GrinderCalibrationRow[]) ?? [];
        setCalibrations(rows);
        if (rows.length > 0) setSelectedCalibrationId(rows[0].id);
      });
  }, [supabase, userId]);

  const selectedCalibration = useMemo(
    () => calibrations.find((item) => item.id === selectedCalibrationId) ?? null,
    [calibrations, selectedCalibrationId]
  );

  const estimatedGrindSize = useMemo(() => {
    const click = Number(clickInput);
    if (!selectedCalibration || Number.isNaN(click)) return null;
    return estimateGrindSizeByClick(selectedCalibration, click);
  }, [clickInput, selectedCalibration]);

  const effectiveGrindSize = estimatedGrindSize ?? manualGrindSize;
  const effectiveGrindValue = grindScale.find((item) => item.key === effectiveGrindSize)?.value ?? 3;

  const score = useMemo(
    () => computeScore(temperature, effectiveGrindValue, extractionTime),
    [temperature, effectiveGrindValue, extractionTime]
  );

  const scoreFeedbackKey =
    score >= 90 ? "scoreFeedbackHigh" : score >= 70 ? "scoreFeedbackMid" : "scoreFeedbackLow";

  const scoreBandLabelKey =
    score >= 90 ? "scoreBandHigh" : score >= 70 ? "scoreBandMid" : "scoreBandLow";

  const scoreFeedbackToneClass =
    score >= 90
      ? "border-[var(--coffee-400)] bg-[var(--coffee-100)]"
      : score >= 70
        ? "border-[var(--border)] bg-[var(--muted)]"
        : "border-[var(--coffee-500)] bg-[var(--coffee-200)]";

  const scoreValueClass =
    score >= 90
      ? "text-[var(--coffee-700)]"
      : score >= 70
        ? "text-[var(--primary)]"
        : "text-[var(--coffee-900)]";

  const scoreGaugeFill =
    score >= 90
      ? "var(--coffee-700)"
      : score >= 70
        ? "var(--primary)"
        : "var(--coffee-900)";

  const gaugeData = [{ name: t("quality"), value: score, fill: scoreGaugeFill }];

  const grindLabelMap: Record<GrindSize, string> = {
    [GrindSize.FINE]: t("grindFine"),
    [GrindSize.MEDIUM_FINE]: t("grindMediumFine"),
    [GrindSize.MEDIUM]: t("grindMedium"),
    [GrindSize.MEDIUM_COARSE]: t("grindMediumCoarse"),
    [GrindSize.COARSE]: t("grindCoarse"),
  };

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
                <Label>{t("grindSize")}</Label>
                <span className="font-medium text-[var(--foreground)]">{grindLabelMap[effectiveGrindSize]}</span>
              </div>
              <select
                value={manualGrindSize}
                onChange={(e) => setManualGrindSize(e.target.value as GrindSize)}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {grindScale.map((item) => (
                  <option key={item.key} value={item.key}>
                    {grindLabelMap[item.key]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--muted-foreground)]">{t("grindHelp")}</p>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="grinder-select">{t("grinderSelect")}</Label>
                  <select
                    id="grinder-select"
                    value={selectedCalibrationId}
                    onChange={(e) => setSelectedCalibrationId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    <option value="">{t("grinderSelectPlaceholder")}</option>
                    {calibrations.map((calibration) => (
                      <option key={calibration.id} value={calibration.id}>
                        {calibration.grinder_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="click-input">{t("clickInput")}</Label>
                  <Input
                    id="click-input"
                    type="number"
                    min={0}
                    value={clickInput}
                    onChange={(e) => setClickInput(e.target.value)}
                    placeholder="18"
                  />
                </div>
              </div>

              <p className="text-xs text-[var(--muted-foreground)]">
                {t("calibrationHint")}
              </p>

              <p className="text-sm font-medium text-[var(--foreground)]">
                {t("estimatedGrindSize")}: {grindLabelMap[effectiveGrindSize]}
              </p>
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
            <CardDescription>{t("simulatedQualityScoreDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div
                className={`text-5xl font-bold tabular-nums transition-all duration-300 sm:text-6xl ${scoreValueClass}`}
                key={score}
              >
                {score.toFixed(1)}
              </div>
              <p className={`-mt-4 text-sm font-medium ${scoreValueClass}`}>{t(scoreBandLabelKey)}</p>
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
              <Card className={`w-full ${scoreFeedbackToneClass}`}>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">{t(scoreFeedbackKey)}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
