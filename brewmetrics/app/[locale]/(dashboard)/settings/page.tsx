"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrinderCalibrationRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [calibrations, setCalibrations] = useState<GrinderCalibrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    grinder_name: "",
    fine_click: "",
    medium_fine_click: "",
    medium_click: "",
    medium_coarse_click: "",
    coarse_click: "",
  });

  useEffect(() => {
    if (!supabase) {
      setError("Supabase not configured.");
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      else setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) return;

    setLoading(true);
    setError(null);

    supabase
      .from("grinder_calibrations")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: selectError }) => {
        setLoading(false);
        if (selectError) {
          setError(selectError.message);
          return;
        }
        setCalibrations((data as GrinderCalibrationRow[]) ?? []);
      });
  }, [supabase, userId]);

  function resetForm() {
    setEditingId(null);
    setForm({
      grinder_name: "",
      fine_click: "",
      medium_fine_click: "",
      medium_click: "",
      medium_coarse_click: "",
      coarse_click: "",
    });
  }

  function startEdit(row: GrinderCalibrationRow) {
    setEditingId(row.id);
    setForm({
      grinder_name: row.grinder_name,
      fine_click: String(row.fine_click),
      medium_fine_click: String(row.medium_fine_click),
      medium_click: String(row.medium_click),
      medium_coarse_click: String(row.medium_coarse_click),
      coarse_click: String(row.coarse_click),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;

    const payload = {
      user_id: userId,
      grinder_name: form.grinder_name.trim(),
      fine_click: Number(form.fine_click),
      medium_fine_click: Number(form.medium_fine_click),
      medium_click: Number(form.medium_click),
      medium_coarse_click: Number(form.medium_coarse_click),
      coarse_click: Number(form.coarse_click),
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
      setError(t("calibrationInvalid"));
      return;
    }

    setSaving(true);
    setError(null);

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("grinder_calibrations")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (data) {
        setCalibrations((prev) => prev.map((row) => (row.id === editingId ? (data as GrinderCalibrationRow) : row)));
      }
      resetForm();
      return;
    }

    const { data, error: insertError } = await supabase
      .from("grinder_calibrations")
      .insert(payload)
      .select()
      .single();

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) setCalibrations((prev) => [data as GrinderCalibrationRow, ...prev]);
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!supabase || !confirm(t("deleteCalibrationConfirm"))) return;

    const { error: deleteError } = await supabase.from("grinder_calibrations").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCalibrations((prev) => prev.filter((row) => row.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
          <CardDescription>{t("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">{t("settingsOptions")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("grinderCalibrationTitle")}</CardTitle>
          <CardDescription>{t("grinderCalibrationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="grinder_name">{t("grinderName")}</Label>
              <Input
                id="grinder_name"
                value={form.grinder_name}
                onChange={(e) => setForm((prev) => ({ ...prev, grinder_name: e.target.value }))}
                placeholder={t("grinderNamePlaceholder")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["fine_click", t("fineClick")],
                ["medium_fine_click", t("mediumFineClick")],
                ["medium_click", t("mediumClick")],
                ["medium_coarse_click", t("mediumCoarseClick")],
                ["coarse_click", t("coarseClick")],
              ].map(([key, label]) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-rose-700">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || loading}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("savingCalibration")}
                  </>
                ) : editingId ? (
                  tCommon("save")
                ) : (
                  t("saveCalibration")
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t("cancelEdit")}
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </div>
            ) : calibrations.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">{t("noCalibrations")}</p>
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
                        {t("clickSummary", {
                          fine: row.fine_click,
                          mediumFine: row.medium_fine_click,
                          medium: row.medium_click,
                          mediumCoarse: row.medium_coarse_click,
                          coarse: row.coarse_click,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
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
