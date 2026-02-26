"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BeanProfileRow } from "@/lib/supabase/types";
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
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Coffee, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const emptyRecord = (userId: string): Omit<BeanProfileRow, "id" | "created_at"> => ({
  user_id: userId,
  bean_name: "",
  variety: "",
  roaster: "",
  origin: "",
  roast_level: "",
  process: "",
});

const varietyOptions = ["Geisha", "Typica", "Bourbon", "Caturra", "Pacamara", "SL28"];

type VarietySort = "none" | "az" | "za";

export default function BeanProfilesPage() {
  const t = useTranslations("beanProfiles");
  const tCommon = useTranslations("common");
  const [records, setRecords] = useState<BeanProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BeanProfileRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRecord(""));
  const [varietyFilter, setVarietyFilter] = useState("all");
  const [varietySort, setVarietySort] = useState<VarietySort>("none");
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      .from("bean_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setRecords((data as BeanProfileRow[]) ?? []);
      });
  }, [supabase, userId]);

  function openCreate() {
    setEditing(null);
    setForm(userId ? emptyRecord(userId) : emptyRecord(""));
    setDialogOpen(true);
  }

  function openEdit(record: BeanProfileRow) {
    setEditing(record);
    setForm({
      user_id: record.user_id,
      bean_name: record.bean_name ?? "",
      variety: record.variety ?? "",
      roaster: record.roaster ?? "",
      origin: record.origin ?? "",
      roast_level: record.roast_level ?? "",
      process: record.process ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);

    const isLegacyNameConstraintError = (message?: string) =>
      Boolean(message?.includes("null value in column \"name\"") && message?.includes("bean_profiles"));

    const payload = {
      bean_name: form.bean_name || null,
      variety: form.variety || null,
      roaster: form.roaster || null,
      origin: form.origin || null,
      roast_level: form.roast_level || null,
      process: form.process || null,
    };

    const legacyPayload = {
      ...payload,
      name: form.bean_name || "",
    };

    if (editing) {
      let { error: e } = await supabase
        .from("bean_profiles")
        .update(payload)
        .eq("id", editing.id);

      if (e && isLegacyNameConstraintError(e.message)) {
        const retry = await supabase
          .from("bean_profiles")
          .update(legacyPayload)
          .eq("id", editing.id);
        e = retry.error;
      }

      setSaving(false);
      if (e) {
        setError(e.message);
        return;
      }
      setRecords((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r))
      );
    } else {
      const insertPayload = {
        ...payload,
        user_id: userId,
      };

      let { data, error: e } = await supabase
        .from("bean_profiles")
        .insert(insertPayload)
        .select()
        .single();

      if (e && isLegacyNameConstraintError(e.message)) {
        const retry = await supabase
          .from("bean_profiles")
          .insert({ ...insertPayload, name: form.bean_name || "" })
          .select()
          .single();
        data = retry.data;
        e = retry.error;
      }

      setSaving(false);
      if (e) {
        setError(e.message);
        return;
      }
      if (data) setRecords((prev) => [data as BeanProfileRow, ...prev]);
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!supabase || !confirm(t("deleteConfirm"))) return;
    const { error: e } = await supabase.from("bean_profiles").delete().eq("id", id);
    if (e) setError(e.message);
    else setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const varietyValues = useMemo(() => {
    return Array.from(
      new Set(records.map((record) => record.variety?.trim()).filter((value): value is string => Boolean(value)))
    ).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const displayedRecords = useMemo(() => {
    let next = [...records];

    if (varietyFilter !== "all") {
      next = next.filter((record) => (record.variety ?? "") === varietyFilter);
    }

    if (varietySort !== "none") {
      next.sort((a, b) => {
        const aVariety = a.variety?.toLowerCase() ?? "";
        const bVariety = b.variety?.toLowerCase() ?? "";
        if (aVariety === bVariety) return 0;
        const base = aVariety.localeCompare(bVariety);
        return varietySort === "az" ? base : -base;
      });
    }

    return next;
  }, [records, varietyFilter, varietySort]);

  const selection = useBulkSelection(displayedRecords);

  async function handleBulkDelete() {
    if (!supabase || selection.selectedCount === 0) return;

    const ids = Array.from(selection.selectedIds);
    const idSet = new Set(ids);

    setBulkDeleting(true);
    const { error: e } = await supabase.from("bean_profiles").delete().in("id", ids);
    setBulkDeleting(false);

    if (e) {
      setError(e.message);
      return;
    }

    setRecords((prev) => prev.filter((record) => !idSet.has(record.id)));
    setBulkDeleteDialogOpen(false);
    selection.exitSelectionMode();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="gap-2" disabled={!userId || selection.isSelectionMode}>
            <Plus className="h-4 w-4" />
            {t("addRecord")}
          </Button>
          <Button type="button" variant="outline" onClick={selection.toggleSelectionMode}>
            {selection.isSelectionMode ? t("selectionDone") : t("selectionEdit")}
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? t("editRecord") : t("newRecord")}</DialogTitle>
              <DialogDescription>{t("fieldsOptional")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bean_name">{t("beanName")}</Label>
                  <Input
                    id="bean_name"
                    value={form.bean_name ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, bean_name: e.target.value }))}
                    placeholder={t("beanNamePlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variety">{t("variety")}</Label>
                  <Input
                    id="variety"
                    list="bean-variety-options"
                    value={form.variety ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
                    placeholder={t("varietyPlaceholder")}
                  />
                  <datalist id="bean-variety-options">
                    {varietyOptions.map((variety) => (
                      <option key={variety} value={variety} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roaster">{t("roaster")}</Label>
                    <Input
                      id="roaster"
                      value={form.roaster ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, roaster: e.target.value }))}
                      placeholder={t("roasterPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="origin">{t("origin")}</Label>
                    <Input
                      id="origin"
                      value={form.origin ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                      placeholder={t("originPlaceholder")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roast_level">{t("roastLevel")}</Label>
                    <Input
                      id="roast_level"
                      value={form.roast_level ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, roast_level: e.target.value }))}
                      placeholder={t("roastLevelPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="process">{t("process")}</Label>
                    <Input
                      id="process"
                      value={form.process ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, process: e.target.value }))}
                      placeholder={t("processPlaceholder")}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
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
      </div>

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
      ) : (
        <>
          {selection.isSelectionMode && (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2 py-4">
                <Button type="button" variant="outline" size="sm" onClick={selection.selectAll}>
                  {t("selectionSelectAll")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={selection.clearSelection}>
                  {t("selectionClear")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={!selection.hasSelection}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("selectionDelete", { count: selection.selectedCount })}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bean-variety-filter" className="text-xs text-[var(--muted-foreground)]">
                {t("varietyFilterLabel")}
              </Label>
              <select
                id="bean-variety-filter"
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
            <div className="grid gap-1.5">
              <Label htmlFor="bean-variety-sort" className="text-xs text-[var(--muted-foreground)]">
                {t("varietySortLabel")}
              </Label>
              <select
                id="bean-variety-sort"
                value={varietySort}
                onChange={(e) => setVarietySort(e.target.value as VarietySort)}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <option value="none">{t("sortNone")}</option>
                <option value="az">{t("sortAz")}</option>
                <option value="za">{t("sortZa")}</option>
              </select>
            </div>
          </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-start gap-2">
                  {selection.isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selection.isSelected(record.id)}
                      onChange={() => selection.toggleItem(record.id)}
                      className="mt-1 h-4 w-4 rounded border-[var(--border)]"
                      aria-label={t("selectionItemAria")}
                    />
                  )}
                  <CardTitle className="text-base font-medium text-[var(--gray-dark)]">
                    {record.bean_name || t("unnamed")}
                  </CardTitle>
                </div>
                {!selection.isSelectionMode && (
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
                )}
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {record.variety && (
                  <p className="text-[var(--muted-foreground)]">{t("variety")}: {record.variety}</p>
                )}
                {record.roaster && (
                  <p className="text-[var(--muted-foreground)]">{t("roaster")}: {record.roaster}</p>
                )}
                {record.origin && (
                  <p className="text-[var(--muted-foreground)]">{t("origin")}: {record.origin}</p>
                )}
                {record.roast_level && (
                  <p className="text-[var(--muted-foreground)]">{t("roastLevel")}: {record.roast_level}</p>
                )}
                {record.process && (
                  <p className="text-[var(--muted-foreground)]">{t("process")}: {record.process}</p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(record.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("selectionDeleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("selectionDeleteConfirm", { count: selection.selectedCount })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDeleteDialogOpen(false)}
                disabled={bulkDeleting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {tCommon("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
}
