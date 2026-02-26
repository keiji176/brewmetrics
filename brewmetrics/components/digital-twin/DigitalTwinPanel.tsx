"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BrewRecipeRow, GrinderCalibrationRow } from "@/lib/supabase/types";
import { GrindSize } from "@/lib/supabase/types";
import { Link } from "@/i18n/navigation";
import { GlossaryHelpTooltip } from "@/components/help/GlossaryHelpTooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";
import { Loader2, Sparkles, Trash2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

type RoastLevel = 1 | 2 | 3 | 4 | 5;

type RoastTarget = {
  temp: number;
  grind: number;
  time: number;
  tempMin: number;
  tempMax: number;
  timeMin: number;
  timeMax: number;
};

const roastTargets: Record<RoastLevel, RoastTarget> = {
  1: { temp: 94, grind: 2.0, time: 165, tempMin: 92, tempMax: 96, timeMin: 150, timeMax: 190 },
  2: { temp: 92, grind: 2.5, time: 155, tempMin: 90, tempMax: 94, timeMin: 145, timeMax: 175 },
  3: { temp: 90, grind: 3.0, time: 150, tempMin: 88, tempMax: 92, timeMin: 135, timeMax: 165 },
  4: { temp: 86, grind: 3.5, time: 140, tempMin: 84, tempMax: 88, timeMin: 125, timeMax: 155 },
  5: { temp: 83, grind: 4.0, time: 130, tempMin: 82, tempMax: 86, timeMin: 115, timeMax: 145 },
};

function computeScore(
  temperature: number,
  grindSize: number,
  extractionTime: number,
  roastLevel: RoastLevel
): number {
  const idealTemp = roastTargets[roastLevel].temp;
  const idealGrind = roastTargets[roastLevel].grind;
  const idealTime = roastTargets[roastLevel].time;

  const tempPenalty = Math.pow(temperature - idealTemp, 2) * 0.5;
  const grindPenalty = Math.pow(grindSize - idealGrind, 2) * 5.0;
  const timePenalty = Math.pow(extractionTime - idealTime, 2) * 0.005;

  return Math.max(
    0,
    Math.min(
      100,
      100 - (tempPenalty + grindPenalty + timePenalty)
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

interface DigitalTwinPanelProps {
  showHeader?: boolean;
  initialValues?: {
    temperature?: number | null;
    extractionTime?: number | null;
    grindSize?: string | null;
  };
  onApplyRecipe?: (recipe: BrewRecipeRow) => void;
}

function normalizeGrindSize(input?: string | null): GrindSize | null {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized.includes("fine") ||
    normalized.includes("細") ||
    normalized === "1"
  ) {
    return GrindSize.FINE;
  }
  if (
    normalized.includes("medium-fine") ||
    normalized.includes("medium fine") ||
    normalized.includes("中細") ||
    normalized === "2"
  ) {
    return GrindSize.MEDIUM_FINE;
  }
  if (
    normalized === "medium" ||
    normalized.includes("中挽") ||
    normalized === "3"
  ) {
    return GrindSize.MEDIUM;
  }
  if (
    normalized.includes("medium-coarse") ||
    normalized.includes("medium coarse") ||
    normalized.includes("中粗") ||
    normalized === "4"
  ) {
    return GrindSize.MEDIUM_COARSE;
  }
  if (
    normalized.includes("coarse") ||
    normalized.includes("粗") ||
    normalized === "5"
  ) {
    return GrindSize.COARSE;
  }

  return null;
}

export function DigitalTwinPanel({ showHeader = true, initialValues, onApplyRecipe }: DigitalTwinPanelProps) {
  const t = useTranslations("digitalTwin");
  const supabase = createClient();
  const wasPerfectScoreRef = useRef(false);

  const [temperature, setTemperature] = useState(92);
  const [manualGrindSize, setManualGrindSize] = useState<GrindSize>(GrindSize.MEDIUM);
  const [extractionTime, setExtractionTime] = useState(150);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(3);
  const [userId, setUserId] = useState<string | null>(null);
  const [calibrations, setCalibrations] = useState<GrinderCalibrationRow[]>([]);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState("");
  const [clickInput, setClickInput] = useState("");
  const [perfectMessage, setPerfectMessage] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<BrewRecipeRow[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeActionLoadingId, setRecipeActionLoadingId] = useState<string | null>(null);
  const [recipeNotice, setRecipeNotice] = useState<string | null>(null);

  const perfectMessages = useMemo(
    () => [
      t("perfectMessage1"),
      t("perfectMessage2"),
      t("perfectMessage3"),
      t("perfectMessage4"),
      t("perfectMessage5"),
      t("perfectMessage6"),
      t("perfectMessage7"),
      t("perfectMessage8"),
      t("perfectMessage9"),
      t("perfectMessage10"),
    ],
    [t]
  );

  useEffect(() => {
    if (initialValues?.temperature != null) {
      const safeTemp = Math.max(80, Math.min(100, initialValues.temperature));
      setTemperature(safeTemp);
    }

    if (initialValues?.extractionTime != null) {
      const safeTime = Math.max(60, Math.min(300, initialValues.extractionTime));
      setExtractionTime(safeTime);
    }

    const mappedGrind = normalizeGrindSize(initialValues?.grindSize);
    if (mappedGrind) {
      setManualGrindSize(mappedGrind);
    }
  }, [initialValues]);

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

  useEffect(() => {
    if (!supabase || !userId) return;

    setRecipesLoading(true);
    supabase
      .from("brew_recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setRecipesLoading(false);
        if (error) {
          setRecipeNotice(t("saveRecipeLoadError"));
          return;
        }
        setSavedRecipes((data as BrewRecipeRow[]) ?? []);
      });
  }, [supabase, userId, t]);

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
    () => computeScore(temperature, effectiveGrindValue, extractionTime, roastLevel),
    [temperature, effectiveGrindValue, extractionTime, roastLevel]
  );

  const selectedRoastTarget = roastTargets[roastLevel];

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

  const isPerfectScore = score === 100;

  useEffect(() => {
    if (isPerfectScore && !wasPerfectScoreRef.current) {
      const selected = perfectMessages[Math.floor(Math.random() * perfectMessages.length)];
      setPerfectMessage(selected);
    }

    if (!isPerfectScore && wasPerfectScoreRef.current) {
      setPerfectMessage(null);
    }

    wasPerfectScoreRef.current = isPerfectScore;
  }, [isPerfectScore, perfectMessages]);

  const gaugeData = [{ name: t("quality"), value: score, fill: scoreGaugeFill }];

  async function handleSaveRecipe() {
    if (!supabase || !userId) {
      setRecipeNotice(t("saveRecipeError"));
      return;
    }

    const currentSettings = {
      roastLevel,
      temperature,
      extractionTime,
      grindSize: effectiveGrindSize,
      score,
      selectedCalibrationId: selectedCalibrationId || null,
      clickInput: clickInput ? Number(clickInput) : null,
    };

    setRecipeActionLoadingId("save");

    const { data, error } = await supabase
      .from("brew_recipes")
      .insert({
        user_id: userId,
        recipe_name: t("savedRecipeName", { score: score.toFixed(1) }),
        roast_level: roastLevel,
        temperature,
        extraction_time: extractionTime,
        grind_size: effectiveGrindSize,
        score,
        selected_calibration_id: selectedCalibrationId || null,
        click_input: clickInput ? Number(clickInput) : null,
      })
      .select()
      .single();

    setRecipeActionLoadingId(null);

    if (error) {
      setRecipeNotice(t("saveRecipeError"));
      return;
    }

    if (data) {
      setSavedRecipes((prev) => [data as BrewRecipeRow, ...prev]);
      setRecipeNotice(t("saveRecipeSuccess"));
    }

    console.log("レシピを保存しました:", currentSettings);
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!supabase || !userId) return;
    if (!confirm(t("deleteRecipeConfirm"))) return;

    setRecipeActionLoadingId(recipeId);
    const { error } = await supabase
      .from("brew_recipes")
      .delete()
      .eq("id", recipeId)
      .eq("user_id", userId);
    setRecipeActionLoadingId(null);

    if (error) {
      setRecipeNotice(t("deleteRecipeError"));
      return;
    }

    setSavedRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    setRecipeNotice(t("deleteRecipeSuccess"));
  }

  function handleApplyRecipe(recipe: BrewRecipeRow) {
    const mappedGrind = normalizeGrindSize(recipe.grind_size);
    if (mappedGrind) {
      setManualGrindSize(mappedGrind);
    }

    setTemperature(Number(recipe.temperature));
    setExtractionTime(Number(recipe.extraction_time));

    if (recipe.selected_calibration_id) {
      setSelectedCalibrationId(recipe.selected_calibration_id);
    }

    setClickInput(recipe.click_input != null ? String(recipe.click_input) : "");
    setRecipeNotice(t("applyRecipeSuccess", { name: recipe.recipe_name }));
    onApplyRecipe?.(recipe);
  }

  const grindLabelMap: Record<GrindSize, string> = {
    [GrindSize.FINE]: t("grindFine"),
    [GrindSize.MEDIUM_FINE]: t("grindMediumFine"),
    [GrindSize.MEDIUM]: t("grindMedium"),
    [GrindSize.MEDIUM_COARSE]: t("grindMediumCoarse"),
    [GrindSize.COARSE]: t("grindCoarse"),
  };

  const roastLabelMap: Record<RoastLevel, string> = {
    1: t("roastLight"),
    2: t("roastMediumLight"),
    3: t("roastMedium"),
    4: t("roastMediumDark"),
    5: t("roastDark"),
  };

  return (
    <div className="space-y-8">
      {showHeader && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--gray-dark)]">{t("parameters")}</CardTitle>
            <CardDescription>{t("parametersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Label>{t("roastLevel")}</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#roasting"
                    description={t("tooltipRoastLevel")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <span className="font-medium text-[var(--foreground)]">{roastLabelMap[roastLevel]}</span>
              </div>
              <select
                value={roastLevel}
                onChange={(e) => setRoastLevel(Number(e.target.value) as RoastLevel)}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <option value={1}>{roastLabelMap[1]}</option>
                <option value={2}>{roastLabelMap[2]}</option>
                <option value={3}>{roastLabelMap[3]}</option>
                <option value={4}>{roastLabelMap[4]}</option>
                <option value={5}>{roastLabelMap[5]}</option>
              </select>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("recommendedRange", {
                  tempMin: selectedRoastTarget.tempMin,
                  tempMax: selectedRoastTarget.tempMax,
                  timeMin: selectedRoastTarget.timeMin,
                  timeMax: selectedRoastTarget.timeMax,
                })}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{t("roastLevelHint")}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Label>{t("temperature")} ({t("temperatureUnit")})</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#extraction"
                    description={t("tooltipExtraction")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <span className="font-medium text-[var(--foreground)]">{temperature}</span>
              </div>
              <input
                type="range"
                min={80}
                max={100}
                step={1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-[var(--muted)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
              />
              <p className="text-xs text-[var(--muted-foreground)]">{t("temperatureHint")}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Label>{t("grindSize")}</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#grindSize"
                    description={t("tooltipGrindSize")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
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
              <p className="text-xs text-[var(--muted-foreground)]">{t("grindSizeHint")}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{t("grindHelp")}</p>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grinder-select">{t("grinderSelect")}</Label>
                    <GlossaryHelpTooltip
                      href="/glossary?category=basics#grindSize"
                      description={t("tooltipGrindSize")}
                      buttonLabel={t("glossaryLink")}
                      learnMoreLabel={t("tooltipSeeMore")}
                    />
                  </div>
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
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Label>{t("extractionTime")} ({t("extractionUnit")})</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#extraction"
                    description={t("tooltipExtraction")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <span className="font-medium text-[var(--foreground)]">{extractionTime}</span>
              </div>
              <input
                type="range"
                min={60}
                max={300}
                step={5}
                value={extractionTime}
                onChange={(e) => setExtractionTime(Number(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-[var(--muted)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
              />
              <p className="text-xs text-[var(--muted-foreground)]">{t("extractionTimeHint")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-[var(--gray-dark)]">{t("simulatedQualityScore")}</CardTitle>
              <GlossaryHelpTooltip
                href="/glossary#simulationScoringFormula"
                description={t("tooltipScoreFormula")}
                buttonLabel={t("scoreGuideLink")}
                learnMoreLabel={t("tooltipSeeMore")}
              />
            </div>
            <CardDescription>{t("simulatedQualityScoreDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div
                  className={`text-5xl font-bold tabular-nums transition-all duration-300 sm:text-6xl ${
                    isPerfectScore
                      ? "bg-gradient-to-r from-pink-500 via-amber-400 via-lime-400 via-cyan-500 to-violet-500 bg-clip-text text-transparent animate-pulse"
                      : scoreValueClass
                  }`}
                  key={score}
                >
                  {score.toFixed(1)}
                </div>
                {isPerfectScore && (
                  <Trophy className="absolute -right-7 -top-1 h-5 w-5 text-amber-500" aria-hidden="true" />
                )}
              </div>
              <p className={`-mt-4 text-sm font-medium ${scoreValueClass}`}>{t(scoreBandLabelKey)}</p>
              {isPerfectScore && (
                <p className="-mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("perfectScoreBadge")}
                </p>
              )}
              {score >= 95 && (
                <Button type="button" onClick={handleSaveRecipe} className="-mt-2" disabled={recipeActionLoadingId === "save"}>
                  {recipeActionLoadingId === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("saveRecipeCta")}
                </Button>
              )}
              {recipeNotice && (
                <p className="-mt-2 text-xs text-[var(--muted-foreground)]">{recipeNotice}</p>
              )}
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
              <Card className={`relative w-full overflow-hidden ${scoreFeedbackToneClass}`}>
                <CardContent className="relative p-4">
                  {isPerfectScore && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100/40 via-transparent to-cyan-100/40"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-amber-500/80"
                        aria-hidden="true"
                      />
                      <Sparkles
                        className="pointer-events-none absolute bottom-3 left-3 h-3.5 w-3.5 text-cyan-500/80"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  {isPerfectScore ? (
                    <p className="text-base font-semibold leading-relaxed text-[var(--foreground)] sm:text-lg">
                      {perfectMessage ?? t("perfectScoreMessage")}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-[var(--foreground)]">{t(scoreFeedbackKey)}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[var(--gray-dark)]">{t("savedRecipesTitle")}</CardTitle>
                  <CardDescription>{t("savedRecipesDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recipesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("loadingSavedRecipes")}
                    </div>
                  ) : savedRecipes.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">{t("noSavedRecipes")}</p>
                  ) : (
                    savedRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[var(--foreground)]">{recipe.recipe_name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {t("savedRecipeMeta", {
                                temp: recipe.temperature,
                                grind: recipe.grind_size,
                                time: recipe.extraction_time,
                                score: recipe.score,
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleApplyRecipe(recipe)}>
                              {t("applyRecipe")}
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              disabled={recipeActionLoadingId === recipe.id}
                            >
                              {recipeActionLoadingId === recipe.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
