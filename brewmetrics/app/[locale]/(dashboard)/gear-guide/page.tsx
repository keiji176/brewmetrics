"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrinderCalibrationRow, UserGearRow } from "@/lib/supabase/types";
import { getMyGearCatalog, getMyGearOptions } from "@/lib/my-gear";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const LOCAL_STORAGE_KEY = "brewmetrics.myGearIds";

export default function GearGuidePage() {
  const t = useTranslations("gearGuide");
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const supabase = createClient();
  const items = useMemo(() => getMyGearCatalog(locale), [locale]);

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<"db" | "local">("local");
  const [notice, setNotice] = useState<string | null>(null);
  const [calibrations, setCalibrations] = useState<GrinderCalibrationRow[]>([]);
  const [calibrationLoading, setCalibrationLoading] = useState(true);
  const [calibrationSaving, setCalibrationSaving] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [editingCalibrationId, setEditingCalibrationId] = useState<string | null>(null);
  const [calibrationForm, setCalibrationForm] = useState({
    grinder_name: "",
    fine_click: "",
    medium_fine_click: "",
    medium_click: "",
    medium_coarse_click: "",
    coarse_click: "",
  });

  useEffect(() => {
    const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw) as string[];
        setSelectedIds(Array.from(new Set(parsed)));
      } catch {
      }
    }

    if (!supabase) {
      setLoading(false);
      setStorageMode("local");
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        setStorageMode("local");
        return;
      }

      setUserId(user.id);
      supabase
        .from("user_gears")
        .select("gear_id")
        .eq("user_id", user.id)
        .then(({ data, error }) => {
          setLoading(false);
          if (error) {
            setStorageMode("local");
            setNotice(t("storageFallback"));
            return;
          }

          const rows = (data as Pick<UserGearRow, "gear_id">[]) ?? [];
          const ids = rows.map((row) => row.gear_id);
          setSelectedIds(ids);
          setStorageMode("db");
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
        });
    });
  }, [supabase, t]);

  useEffect(() => {
    if (!supabase || !userId) {
      setCalibrationLoading(false);
      return;
    }

    setCalibrationLoading(true);
    setCalibrationError(null);

    supabase
      .from("grinder_calibrations")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setCalibrationLoading(false);
        if (error) {
          setCalibrationError(error.message);
          return;
        }
        setCalibrations((data as GrinderCalibrationRow[]) ?? []);
      });
  }, [supabase, userId]);

  const myGearOptions = useMemo(
    () => getMyGearOptions(selectedIds, locale),
    [selectedIds, locale]
  );

  async function handleToggle(gearId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...selectedIds, gearId]))
      : selectedIds.filter((id) => id !== gearId);

    setSelectedIds(next);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));

    if (!supabase || !userId || storageMode !== "db") return;

    if (checked) {
      const { error } = await supabase
        .from("user_gears")
        .upsert({ user_id: userId, gear_id: gearId }, { onConflict: "user_id,gear_id" });

      if (error) {
        setStorageMode("local");
        setNotice(t("storageFallback"));
      }
      return;
    }

    const { error } = await supabase
      .from("user_gears")
      .delete()
      .eq("user_id", userId)
      .eq("gear_id", gearId);

    if (error) {
      setStorageMode("local");
      setNotice(t("storageFallback"));
    }
  }

  function resetCalibrationForm() {
    setEditingCalibrationId(null);
    setCalibrationForm({
      grinder_name: "",
      fine_click: "",
      medium_fine_click: "",
      medium_click: "",
      medium_coarse_click: "",
      coarse_click: "",
    });
  }

  function startEditCalibration(row: GrinderCalibrationRow) {
    setEditingCalibrationId(row.id);
    setCalibrationForm({
      grinder_name: row.grinder_name,
      fine_click: String(row.fine_click),
      medium_fine_click: String(row.medium_fine_click),
      medium_click: String(row.medium_click),
      medium_coarse_click: String(row.medium_coarse_click),
      coarse_click: String(row.coarse_click),
    });
  }

  async function handleCalibrationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;

    const payload = {
      user_id: userId,
      grinder_name: calibrationForm.grinder_name.trim(),
      fine_click: Number(calibrationForm.fine_click),
      medium_fine_click: Number(calibrationForm.medium_fine_click),
      medium_click: Number(calibrationForm.medium_click),
      medium_coarse_click: Number(calibrationForm.medium_coarse_click),
      coarse_click: Number(calibrationForm.coarse_click),
    };

    if (
      !payload.grinder_name ||
      [
        payload.fine_click,
        payload.medium_fine_click,
        payload.medium_click,
        payload.medium_coarse_click,
        payload.coarse_click,
      ].some((value) => Number.isNaN(value))
    ) {
      setCalibrationError(tSettings("calibrationInvalid"));
      return;
    }

    setCalibrationSaving(true);
    setCalibrationError(null);

    if (editingCalibrationId) {
      const { data, error } = await supabase
        .from("grinder_calibrations")
        .update(payload)
        .eq("id", editingCalibrationId)
        .select()
        .single();

      setCalibrationSaving(false);
      if (error) {
        setCalibrationError(error.message);
        return;
      }

      if (data) {
        setCalibrations((prev) =>
          prev.map((row) => (row.id === editingCalibrationId ? (data as GrinderCalibrationRow) : row))
        );
      }
      resetCalibrationForm();
      return;
    }

    const { data, error } = await supabase
      .from("grinder_calibrations")
      .insert(payload)
      .select()
      .single();

    setCalibrationSaving(false);
    if (error) {
      setCalibrationError(error.message);
      return;
    }

    if (data) {
      setCalibrations((prev) => [data as GrinderCalibrationRow, ...prev]);
    }
    resetCalibrationForm();
  }

  async function handleCalibrationDelete(id: string) {
    if (!supabase || !confirm(tSettings("deleteCalibrationConfirm"))) return;

    const { error } = await supabase.from("grinder_calibrations").delete().eq("id", id);
    if (error) {
      setCalibrationError(error.message);
      return;
    }

    setCalibrations((prev) => prev.filter((row) => row.id !== id));
    if (editingCalibrationId === id) {
      resetCalibrationForm();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
        <p>{t("selectionSummary", { count: selectedIds.length })}</p>
        <p className="mt-1 text-xs">
          {storageMode === "db" ? t("storageDb") : t("storageLocal")}
        </p>
        {notice && <p className="mt-2 text-xs text-[var(--primary)]">{notice}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.name} className="h-full">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary">{item.category}</Badge>
                <span className="text-sm font-medium text-[var(--primary)]">{item.priceRange}</span>
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.bestFor}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">{item.note}</p>
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {selectedIds.includes(item.id) ? t("owned") : t("register")}
                </span>
                <Switch
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) => handleToggle(item.id, checked)}
                  disabled={loading}
                  aria-label={`${item.name} ${t("toggleLabel")}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("futureIntegrationTitle")}</CardTitle>
          <CardDescription>{t("futureIntegrationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {myGearOptions.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{t("futureNoSelection")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myGearOptions.map((option) => (
                <Badge key={option.value} variant="outline">
                  {option.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tSettings("grinderCalibrationTitle")}</CardTitle>
          <CardDescription>{tSettings("grinderCalibrationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCalibrationSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="my-gear-grinder-name">{tSettings("grinderName")}</Label>
              <Input
                id="my-gear-grinder-name"
                value={calibrationForm.grinder_name}
                onChange={(e) =>
                  setCalibrationForm((prev) => ({ ...prev, grinder_name: e.target.value }))
                }
                placeholder={tSettings("grinderNamePlaceholder")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["fine_click", tSettings("fineClick")],
                ["medium_fine_click", tSettings("mediumFineClick")],
                ["medium_click", tSettings("mediumClick")],
                ["medium_coarse_click", tSettings("mediumCoarseClick")],
                ["coarse_click", tSettings("coarseClick")],
              ].map(([key, label]) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={`my-gear-${key}`}>{label}</Label>
                  <Input
                    id={`my-gear-${key}`}
                    type="number"
                    min={0}
                    value={calibrationForm[key as keyof typeof calibrationForm]}
                    onChange={(e) =>
                      setCalibrationForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            {calibrationError && <p className="text-sm text-rose-700">{calibrationError}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={calibrationSaving || calibrationLoading || !userId}>
                {calibrationSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tSettings("savingCalibration")}
                  </>
                ) : editingCalibrationId ? (
                  tCommon("save")
                ) : (
                  tSettings("saveCalibration")
                )}
              </Button>
              {editingCalibrationId && (
                <Button type="button" variant="outline" onClick={resetCalibrationForm}>
                  {tSettings("cancelEdit")}
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {calibrationLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </div>
            ) : calibrations.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{tSettings("noCalibrations")}</p>
            ) : (
              calibrations.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{row.grinder_name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {tSettings("clickSummary", {
                          fine: row.fine_click,
                          mediumFine: row.medium_fine_click,
                          medium: row.medium_click,
                          mediumCoarse: row.medium_coarse_click,
                          coarse: row.coarse_click,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => startEditCalibration(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleCalibrationDelete(row.id)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
