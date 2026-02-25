"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AICoachPanel } from "@/components/ai-coach/AICoachPanel";
import { DigitalTwinPanel } from "@/components/digital-twin/DigitalTwinPanel";
import { GlossaryHelpTooltip } from "@/components/help/GlossaryHelpTooltip";
import { Coffee, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type BrewRecord = {
  id: string;
  user_id: string;
  bean_name: string | null;
  variety: string | null;
  roaster: string | null;
  grind_size: string | null;
  temperature: number | null;
  coffee_weight: number | null;
  water_weight: number | null;
  brew_time: number | null;
  score: number | null;
  notes: string | null;
  created_at: string;
};

type BrewRecordForm = {
  bean_name: string;
  variety: string;
  roaster: string;
  grind_size: string;
  temperature: number | null;
  coffee_weight: number | null;
  water_weight: number | null;
  brew_time: number | null;
  score: number | null;
  notes: string;
};

type BrewRecordsTab = "record" | "analysis";


const emptyForm: BrewRecordForm = {
  bean_name: "",
  variety: "",
  roaster: "",
  grind_size: "",
  temperature: null,
  coffee_weight: null,
  water_weight: null,
  brew_time: null,
  score: null,
  notes: "",
};

export default function BrewRecordsPage() {
  const t = useTranslations("brewRecords");
  const tCommon = useTranslations("common");

  const [records, setRecords] = useState<BrewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrewRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrewRecordForm>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [varietyFilter, setVarietyFilter] = useState("all");
  const [varietySort, setVarietySort] = useState<"none" | "az" | "za">("none");
  const [activeTab, setActiveTab] = useState<BrewRecordsTab>("record");

  const varietyOptions = ["Geisha", "Typica", "Bourbon", "Caturra", "Pacamara", "SL28"];

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) {
      if (supabase && !userId) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from("brew_records")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: selectError }) => {
        setLoading(false);
        if (selectError) {
          setError(selectError.message);
          return;
        }
        setRecords((data as BrewRecord[]) ?? []);
      });
  }, [supabase, userId]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(record: BrewRecord) {
    setEditing(record);
    setForm({
      bean_name: record.bean_name ?? "",
      variety: record.variety ?? "",
      roaster: record.roaster ?? "",
      grind_size: record.grind_size ?? "",
      temperature: record.temperature,
      coffee_weight: record.coffee_weight,
      water_weight: record.water_weight,
      brew_time: record.brew_time,
      score: record.score,
      notes: record.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;

    setSaving(true);

    const payload = {
      bean_name: form.bean_name || null,
      variety: form.variety || null,
      roaster: form.roaster || null,
      grind_size: form.grind_size || null,
      temperature: form.temperature != null ? Number(form.temperature) : null,
      coffee_weight: form.coffee_weight != null ? Number(form.coffee_weight) : null,
      water_weight: form.water_weight != null ? Number(form.water_weight) : null,
      brew_time: form.brew_time != null ? Number(form.brew_time) : null,
      score: form.score != null ? Number(form.score) : null,
      notes: form.notes || null,
    };

    if (editing) {
      const { error: updateError } = await supabase
        .from("brew_records")
        .update(payload)
        .eq("id", editing.id);

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setRecords((prev) =>
        prev.map((record) =>
          record.id === editing.id ? { ...record, ...payload } : record
        )
      );
    } else {
      const { data, error: insertError } = await supabase
        .from("brew_records")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();

      setSaving(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (data) setRecords((prev) => [data as BrewRecord, ...prev]);
    }

    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!supabase || !confirm(t("deleteConfirm"))) return;
    const { error: deleteError } = await supabase
      .from("brew_records")
      .delete()
      .eq("id", id);

    if (deleteError) setError(deleteError.message);
    else setRecords((prev) => prev.filter((record) => record.id !== id));
  }

  const stats = useMemo(() => {
    const totalBrews = records.length;

    const scores = records
      .map((record) => record.score)
      .filter((score): score is number => score != null);
    const avgScore =
      scores.length > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
        : null;

    const beanCountMap = new Map<string, number>();
    records.forEach((record) => {
      const beanName = record.bean_name?.trim();
      if (!beanName) return;
      beanCountMap.set(beanName, (beanCountMap.get(beanName) ?? 0) + 1);
    });

    let favoriteBean: string | null = null;
    let maxCount = 0;
    beanCountMap.forEach((count, beanName) => {
      if (count > maxCount) {
        favoriteBean = beanName;
        maxCount = count;
      }
    });

    return {
      totalBrews,
      avgScore,
      favoriteBean,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let next = records;

    if (varietyFilter !== "all") {
      next = next.filter((record) => (record.variety ?? "") === varietyFilter);
    }

    const searched = keyword
      ? next.filter((record) => {
          const beanName = record.bean_name?.toLowerCase() ?? "";
          const variety = record.variety?.toLowerCase() ?? "";
          const notes = record.notes?.toLowerCase() ?? "";
          return beanName.includes(keyword) || variety.includes(keyword) || notes.includes(keyword);
        })
      : next;

    if (varietySort === "none") return searched;

    return [...searched].sort((a, b) => {
      const aVariety = a.variety?.toLowerCase() ?? "";
      const bVariety = b.variety?.toLowerCase() ?? "";
      const base = aVariety.localeCompare(bVariety);
      return varietySort === "az" ? base : -base;
    });
  }, [records, searchQuery, varietyFilter, varietySort]);

  const varietyValues = useMemo(() => {
    return Array.from(
      new Set(records.map((record) => record.variety?.trim()).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b));
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          disabled={!userId || activeTab !== "record"}
        >
          <Plus className="h-4 w-4" />
          {t("addRecord")}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("record")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "record"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          {t("tabRecord")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analysis")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "analysis"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          {t("tabAnalysis")}
        </button>
      </div>

      {activeTab === "record" ? (
        <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="sticky top-0 z-10 border-b bg-[var(--card)] px-6 pt-6 pb-4">
            <DialogTitle>{editing ? t("editRecord") : t("newRecord")}</DialogTitle>
            <DialogDescription>{t("fieldsOptional")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bean_name">{t("beanName")}</Label>
                <Input
                  id="bean_name"
                  value={form.bean_name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, bean_name: e.target.value }))
                  }
                  placeholder={t("beanNamePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="variety">{t("variety")}</Label>
                <Input
                  id="variety"
                  list="brew-variety-options"
                  value={form.variety}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, variety: e.target.value }))
                  }
                  placeholder={t("varietyPlaceholder")}
                />
                <datalist id="brew-variety-options">
                  {varietyOptions.map((variety) => (
                    <option key={variety} value={variety} />
                  ))}
                </datalist>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="roaster">{t("roaster")}</Label>
                <Input
                  id="roaster"
                  value={form.roaster}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, roaster: e.target.value }))
                  }
                  placeholder={t("roasterPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="grind_size">{t("grindSize")}</Label>
                    <GlossaryHelpTooltip
                      href="/glossary#grindSize"
                      description={t("tooltipGrindSize")}
                      buttonLabel={t("glossaryLink")}
                      learnMoreLabel={t("tooltipSeeMore")}
                    />
                  </div>
                  <Input
                    id="grind_size"
                    value={form.grind_size}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, grind_size: e.target.value }))
                    }
                    placeholder={t("grindSizePlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="temperature">{t("temperature")}</Label>
                    <GlossaryHelpTooltip
                      href="/glossary#extraction"
                      description={t("tooltipExtraction")}
                      buttonLabel={t("glossaryLink")}
                      learnMoreLabel={t("tooltipSeeMore")}
                    />
                  </div>
                  <Input
                    id="temperature"
                    type="number"
                    min={70}
                    max={100}
                    value={form.temperature ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        temperature: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder={t("temperaturePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="coffee_weight">{t("coffeeWeight")}</Label>
                    <GlossaryHelpTooltip
                      href="/glossary#brewRatio"
                      description={t("tooltipBrewRatio")}
                      buttonLabel={t("glossaryLink")}
                      learnMoreLabel={t("tooltipSeeMore")}
                    />
                  </div>
                  <Input
                    id="coffee_weight"
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.coffee_weight ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        coffee_weight: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder={t("coffeeWeightPlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="water_weight">{t("waterWeight")}</Label>
                    <GlossaryHelpTooltip
                      href="/glossary#brewRatio"
                      description={t("tooltipBrewRatio")}
                      buttonLabel={t("glossaryLink")}
                      learnMoreLabel={t("tooltipSeeMore")}
                    />
                  </div>
                  <Input
                    id="water_weight"
                    type="number"
                    min={0}
                    step={1}
                    value={form.water_weight ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        water_weight: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder={t("waterWeightPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="brew_time">{t("brewTime")}</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#extraction"
                    description={t("tooltipExtraction")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <Input
                  id="brew_time"
                  type="number"
                  min={0}
                  value={form.brew_time ?? ""}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      brew_time: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder={t("brewTimePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cupping_score">{t("scoreOrImpression")}</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#cupping"
                    description={t("tooltipCupping")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <Input
                  id="cupping_score"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.score ?? ""}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      score: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder={t("scorePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="notes">{t("notes")}</Label>
                  <GlossaryHelpTooltip
                    href="/glossary#flavorNotes"
                    description={t("tooltipFlavorNotes")}
                    buttonLabel={t("glossaryLink")}
                    learnMoreLabel={t("tooltipSeeMore")}
                  />
                </div>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, notes: e.target.value }))
                  }
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-10 border-t bg-[var(--card)] px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : editing ? (
                  tCommon("save")
                ) : (
                  tCommon("create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("statsTotalBrews")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.totalBrews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("statsAvgScore")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.avgScore ?? "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("statsFavoriteBean")}</CardDescription>
            <CardTitle className="line-clamp-1 text-lg">
              {stats.favoriteBean ?? t("statsNoFavoriteBean")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex w-full max-w-4xl flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full md:flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <div className="grid w-full gap-1.5 md:w-56">
          <Label htmlFor="brew-variety-filter" className="text-xs text-[var(--muted-foreground)]">
            {t("varietyFilterLabel")}
          </Label>
          <select
            id="brew-variety-filter"
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="all">{t("allVarieties")}</option>
            {varietyValues.map((variety) => (
              <option key={variety} value={variety}>
                {variety}
              </option>
            ))}
          </select>
        </div>
        <div className="grid w-full gap-1.5 md:w-56">
          <Label htmlFor="brew-variety-sort" className="text-xs text-[var(--muted-foreground)]">
            {t("varietySortLabel")}
          </Label>
          <select
            id="brew-variety-sort"
            value={varietySort}
            onChange={(e) => setVarietySort(e.target.value as "none" | "az" | "za")}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="none">{t("sortNone")}</option>
            <option value="az">{t("sortAz")}</option>
            <option value="za">{t("sortZa")}</option>
          </select>
        </div>
      </div>

      <AICoachPanel context="brew" entries={records} />

      {error && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="py-4">
            <p className="text-sm text-rose-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Coffee className="h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mt-4 font-medium text-[var(--foreground)]">{t("noRecords")}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("noRecordsHint")}</p>
            <Button className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("addRecord")}
            </Button>
          </CardContent>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-[var(--muted-foreground)]">
            {t("noSearchResults")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium text-[var(--gray-dark)]">
                    {record.bean_name || t("unnamed")}
                  </CardTitle>
                  {record.roaster && (
                    <CardDescription>{record.roaster}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(record)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600 hover:text-rose-700"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {record.variety && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("variety")} : {record.variety}
                  </p>
                )}
                {record.grind_size && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("grind")} : {record.grind_size}
                  </p>
                )}
                {record.temperature != null && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("temperatureShort")} : {record.temperature}°C
                  </p>
                )}
                {record.coffee_weight != null && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("coffeeWeightShort")} : {record.coffee_weight}g
                  </p>
                )}
                {record.water_weight != null && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("waterWeightShort")} : {record.water_weight}g
                  </p>
                )}
                {record.brew_time != null && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("brewTimeShort")} : {record.brew_time}s
                  </p>
                )}
                {record.score != null && (
                  <p className="font-medium text-[var(--primary)]">
                    {t("score")} : {record.score}
                  </p>
                )}
                {record.notes && (
                  <p className="line-clamp-2 text-[var(--muted-foreground)]">{record.notes}</p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(record.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
            {t("tabAnalysisDescription")}
          </div>
          <DigitalTwinPanel
            showHeader={false}
            initialValues={{
              temperature: form.temperature,
              extractionTime: form.brew_time,
              grindSize: form.grind_size,
            }}
          />
        </div>
      )}
    </div>
  );
}
