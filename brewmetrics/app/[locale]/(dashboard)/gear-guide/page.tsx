"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GrinderCalibrationRow, UserCustomGearRow, UserGearRow } from "@/lib/supabase/types";
import { getMyGearCatalog, getMyGearOptions } from "@/lib/my-gear";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const LOCAL_STORAGE_KEY = "brewmetrics.myGearIds";
const LOCAL_STORAGE_CUSTOM_GEARS_KEY = "brewmetrics.customGears";

type CustomGearCard = {
  id: string;
  category: string;
  gear_name: string;
  created_at: string;
};

type GearCardItem = {
  key: string;
  gearId: string;
  isCustom: boolean;
  customId?: string;
  customCategory?: string;
  category: string;
  name: string;
  bestFor: string;
  note: string;
};

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
  const [customGears, setCustomGears] = useState<CustomGearCard[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addingCustomGear, setAddingCustomGear] = useState(false);
  const [editingCustomGear, setEditingCustomGear] = useState(false);
  const [editingCustomGearId, setEditingCustomGearId] = useState<string | null>(null);
  const [customGearError, setCustomGearError] = useState<string | null>(null);
  const [customGearForm, setCustomGearForm] = useState({
    category: "dripper",
    gear_name: "",
  });
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

  function formatDbError(error: unknown): string {
    if (!error || typeof error !== "object") return "unknown";
    const candidate = error as { code?: string; message?: string; details?: string };
    const code = candidate.code ?? "unknown";
    const message = candidate.message ?? "unknown error";
    const details = candidate.details ? ` (${candidate.details})` : "";
    return `${code}: ${message}${details}`;
  }

  useEffect(() => {
    const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw) as string[];
        setSelectedIds(Array.from(new Set(parsed)));
      } catch {
      }
    }

    const localCustomRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY);
    if (localCustomRaw) {
      try {
        const parsed = JSON.parse(localCustomRaw) as CustomGearCard[];
        setCustomGears(parsed);
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
      Promise.all([
        supabase.from("user_gears").select("gear_id").eq("user_id", user.id),
        supabase.from("user_custom_gears").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]).then(([gearRes, customRes]) => {
        setLoading(false);

        if (gearRes.error) {
          const reason = formatDbError(gearRes.error);
          console.error("[my-gear] Failed to load user_gears:", gearRes.error);
          setStorageMode("local");
          setNotice(t("storageFallbackWithReason", { reason }));
          return;
        }

        const rows = (gearRes.data as Pick<UserGearRow, "gear_id">[]) ?? [];
        const ids = rows.map((row) => row.gear_id);
        setSelectedIds(ids);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));

        if (customRes.error) {
          const reason = formatDbError(customRes.error);
          console.error("[my-gear] Failed to load user_custom_gears:", customRes.error);
          setStorageMode("local");
          setNotice(t("storageFallbackWithReason", { reason }));
          return;
        }

        const customRows = (customRes.data as UserCustomGearRow[]) ?? [];
        const normalizedCustom = customRows.map((row) => ({
          id: row.id,
          category: row.category,
          gear_name: row.gear_name,
          created_at: row.created_at,
        }));
        setCustomGears(normalizedCustom);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY, JSON.stringify(normalizedCustom));
        setStorageMode("db");
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

  const categoryOptions = useMemo(
    () => [
      { value: "dripper", label: t("categoryDripper") },
      { value: "grinder", label: t("categoryGrinder") },
      { value: "scale", label: t("categoryScale") },
      { value: "kettle", label: t("categoryKettle") },
      { value: "server", label: t("categoryServer") },
      { value: "other", label: t("categoryOther") },
    ],
    [t]
  );

  const cardItems = useMemo<GearCardItem[]>(() => {
    const catalogItems = items.map((item) => ({
      key: item.id,
      gearId: item.id,
      isCustom: false,
      category: item.category,
      name: item.name,
      bestFor: item.bestFor,
      note: item.note,
    }));

    const customItems = customGears.map((item) => {
      const categoryLabel = categoryOptions.find((option) => option.value === item.category)?.label ?? item.category;
      return {
        key: `custom:${item.id}`,
        gearId: `custom:${item.id}`,
        isCustom: true,
        customId: item.id,
        customCategory: item.category,
        category: categoryLabel,
        name: item.gear_name,
        bestFor: t("customGearBestFor"),
        note: t("customGearNote"),
      };
    });

    return [...catalogItems, ...customItems];
  }, [items, customGears, categoryOptions, t]);

  const myGearOptions = useMemo(() => {
    const base = getMyGearOptions(selectedIds, locale);
    const selectedSet = new Set(selectedIds);
    const customSelected = customGears
      .filter((item) => selectedSet.has(`custom:${item.id}`))
      .map((item) => ({ value: `custom:${item.id}`, label: item.gear_name }));
    return [...base, ...customSelected];
  }, [selectedIds, locale, customGears]);

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
        const reason = formatDbError(error);
        console.error("[my-gear] Failed to upsert user_gears:", error);
        setStorageMode("local");
        setNotice(t("storageFallbackWithReason", { reason }));
      }
      return;
    }

    const { error } = await supabase
      .from("user_gears")
      .delete()
      .eq("user_id", userId)
      .eq("gear_id", gearId);

    if (error) {
      const reason = formatDbError(error);
      console.error("[my-gear] Failed to delete user_gears:", error);
      setStorageMode("local");
      setNotice(t("storageFallbackWithReason", { reason }));
    }
  }

  async function handleAddCustomGear(e: React.FormEvent) {
    e.preventDefault();

    const gearName = customGearForm.gear_name.trim();
    if (!gearName) {
      setCustomGearError(t("customGearNameRequired"));
      return;
    }

    setAddingCustomGear(true);
    setCustomGearError(null);

    if (supabase && userId && storageMode === "db") {
      const { data, error } = await supabase
        .from("user_custom_gears")
        .insert({ user_id: userId, category: customGearForm.category, gear_name: gearName })
        .select()
        .single();

      if (error) {
        const reason = formatDbError(error);
        console.error("[my-gear] Failed to insert user_custom_gears:", error);
        setStorageMode("local");
        setNotice(t("storageFallbackWithReason", { reason }));
      } else if (data) {
        const inserted = data as UserCustomGearRow;
        const nextCustom = [
          {
            id: inserted.id,
            category: inserted.category,
            gear_name: inserted.gear_name,
            created_at: inserted.created_at,
          },
          ...customGears,
        ];
        setCustomGears(nextCustom);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY, JSON.stringify(nextCustom));

        const gearId = `custom:${inserted.id}`;
        const nextSelected = Array.from(new Set([...selectedIds, gearId]));
        setSelectedIds(nextSelected);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextSelected));

        const { error: selectError } = await supabase
          .from("user_gears")
          .upsert({ user_id: userId, gear_id: gearId }, { onConflict: "user_id,gear_id" });

        if (selectError) {
          const reason = formatDbError(selectError);
          console.error("[my-gear] Failed to select custom gear in user_gears:", selectError);
          setStorageMode("local");
          setNotice(t("storageFallbackWithReason", { reason }));
        }
      }
    } else {
      const localId = `${Date.now()}`;
      const localCustom: CustomGearCard = {
        id: localId,
        category: customGearForm.category,
        gear_name: gearName,
        created_at: new Date().toISOString(),
      };
      const nextCustom = [localCustom, ...customGears];
      setCustomGears(nextCustom);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY, JSON.stringify(nextCustom));

      const nextSelected = Array.from(new Set([...selectedIds, `custom:${localId}`]));
      setSelectedIds(nextSelected);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextSelected));
    }

    setAddingCustomGear(false);
    setAddDialogOpen(false);
    setCustomGearForm({ category: "dripper", gear_name: "" });
  }

  function startEditCustomGear(customId: string, category: string, gearName: string) {
    setEditingCustomGearId(customId);
    setCustomGearForm({ category, gear_name: gearName });
    setCustomGearError(null);
    setEditDialogOpen(true);
  }

  function applyLocalCustomGearUpdate(customId: string, category: string, gearName: string) {
    setCustomGears((prev) => {
      const next = prev.map((gear) =>
        gear.id === customId
          ? {
              ...gear,
              category,
              gear_name: gearName,
            }
          : gear
      );
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function applyLocalCustomGearDelete(customId: string) {
    const customGearId = `custom:${customId}`;

    setCustomGears((prev) => {
      const next = prev.filter((gear) => gear.id !== customId);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_GEARS_KEY, JSON.stringify(next));
      return next;
    });

    setSelectedIds((prev) => {
      const next = prev.filter((id) => id !== customGearId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleEditCustomGear(e: React.FormEvent) {
    e.preventDefault();

    if (!editingCustomGearId) return;

    const gearName = customGearForm.gear_name.trim();
    if (!gearName) {
      setCustomGearError(t("customGearNameRequired"));
      return;
    }

    setEditingCustomGear(true);
    setCustomGearError(null);

    if (supabase && userId && storageMode === "db") {
      const { error } = await supabase
        .from("user_custom_gears")
        .update({ category: customGearForm.category, gear_name: gearName })
        .eq("user_id", userId)
        .eq("id", editingCustomGearId);

      if (error) {
        const reason = formatDbError(error);
        console.error("[my-gear] Failed to update user_custom_gears:", error);
        setStorageMode("local");
        setNotice(t("storageFallbackWithReason", { reason }));
      }
    }

    applyLocalCustomGearUpdate(editingCustomGearId, customGearForm.category, gearName);

    setEditingCustomGear(false);
    setEditDialogOpen(false);
    setEditingCustomGearId(null);
    setCustomGearForm({ category: "dripper", gear_name: "" });
  }

  async function handleDeleteCustomGear(customId: string, gearName: string) {
    if (!confirm(t("deleteCustomGearConfirm", { name: gearName }))) return;

    if (supabase && userId && storageMode === "db") {
      const customGearId = `custom:${customId}`;
      const [deleteCustomRes, deleteSelectedRes] = await Promise.all([
        supabase.from("user_custom_gears").delete().eq("user_id", userId).eq("id", customId),
        supabase
          .from("user_gears")
          .delete()
          .eq("user_id", userId)
          .eq("gear_id", customGearId),
      ]);

      if (deleteCustomRes.error || deleteSelectedRes.error) {
        const reason = formatDbError(deleteCustomRes.error ?? deleteSelectedRes.error);
        console.error("[my-gear] Failed to delete custom gear:", {
          customGearError: deleteCustomRes.error,
          selectionError: deleteSelectedRes.error,
        });
        setStorageMode("local");
        setNotice(t("storageFallbackWithReason", { reason }));
      }
    }

    applyLocalCustomGearDelete(customId);

    if (editingCustomGearId === customId) {
      setEditDialogOpen(false);
      setEditingCustomGearId(null);
      setCustomGearForm({ category: "dripper", gear_name: "" });
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
        {cardItems.map((item) => (
          <Card key={item.key} className="h-full">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary">{item.category}</Badge>
                {item.isCustom && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        item.customId &&
                        item.customCategory &&
                        startEditCustomGear(item.customId, item.customCategory, item.name)
                      }
                      aria-label={`${item.name} ${tCommon("edit")}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => item.customId && handleDeleteCustomGear(item.customId, item.name)}
                      aria-label={`${item.name} ${tCommon("delete")}`}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.bestFor}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">{item.note}</p>
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {selectedIds.includes(item.gearId) ? t("owned") : t("register")}
                </span>
                <Switch
                  checked={selectedIds.includes(item.gearId)}
                  onCheckedChange={(checked) => handleToggle(item.gearId, checked)}
                  disabled={loading}
                  aria-label={`${item.name} ${t("toggleLabel")}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <button
          type="button"
          onClick={() => setAddDialogOpen(true)}
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">{t("addCustomGear")}</span>
        </button>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addCustomGear")}</DialogTitle>
            <DialogDescription>{t("addCustomGearDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddCustomGear}>
            <div className="grid gap-2">
              <Label htmlFor="custom-gear-category">{t("customGearCategory")}</Label>
              <select
                id="custom-gear-category"
                value={customGearForm.category}
                onChange={(e) =>
                  setCustomGearForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-gear-name">{t("customGearName")}</Label>
              <Input
                id="custom-gear-name"
                value={customGearForm.gear_name}
                onChange={(e) =>
                  setCustomGearForm((prev) => ({ ...prev, gear_name: e.target.value }))
                }
                placeholder={t("customGearNamePlaceholder")}
              />
            </div>

            {customGearError && <p className="text-sm text-rose-700">{customGearError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={addingCustomGear}>
                {addingCustomGear ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("addingCustomGear")}
                  </>
                ) : (
                  t("addAction")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editCustomGear")}</DialogTitle>
            <DialogDescription>{t("editCustomGearDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditCustomGear}>
            <div className="grid gap-2">
              <Label htmlFor="edit-custom-gear-category">{t("customGearCategory")}</Label>
              <select
                id="edit-custom-gear-category"
                value={customGearForm.category}
                onChange={(e) =>
                  setCustomGearForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-custom-gear-name">{t("customGearName")}</Label>
              <Input
                id="edit-custom-gear-name"
                value={customGearForm.gear_name}
                onChange={(e) =>
                  setCustomGearForm((prev) => ({ ...prev, gear_name: e.target.value }))
                }
                placeholder={t("customGearNamePlaceholder")}
              />
            </div>

            {customGearError && <p className="text-sm text-rose-700">{customGearError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={editingCustomGear}>
                {editingCustomGear ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("updatingCustomGear")}
                  </>
                ) : (
                  tCommon("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
