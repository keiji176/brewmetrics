"use client";

import { useEffect, useState } from "react";
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
import { Coffee, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type BrewRecord = {
  id: string;
  user_id: string;
  bean_name: string | null;
  roaster: string | null;
  grind_size: string | null;
  water_temperature: number | null;
  brew_method: string | null;
  cupping_score: number | null;
  notes: string | null;
  created_at: string;
};

type BrewRecordForm = {
  bean_name: string;
  roaster: string;
  grind_size: string;
  water_temperature: number | null;
  brew_method: string;
  cupping_score: number | null;
  notes: string;
};

const emptyForm: BrewRecordForm = {
  bean_name: "",
  roaster: "",
  grind_size: "",
  water_temperature: null,
  brew_method: "",
  cupping_score: null,
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
      roaster: record.roaster ?? "",
      grind_size: record.grind_size ?? "",
      water_temperature: record.water_temperature,
      brew_method: record.brew_method ?? "",
      cupping_score: record.cupping_score,
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
      roaster: form.roaster || null,
      grind_size: form.grind_size || null,
      water_temperature:
        form.water_temperature != null ? Number(form.water_temperature) : null,
      brew_method: form.brew_method || null,
      cupping_score: form.cupping_score != null ? Number(form.cupping_score) : null,
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={!userId}>
          <Plus className="h-4 w-4" />
          {t("addRecord")}
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
                  value={form.bean_name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, bean_name: e.target.value }))
                  }
                  placeholder={t("beanNamePlaceholder")}
                />
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
                  <Label htmlFor="grind_size">{t("grindSize")}</Label>
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
                  <Label htmlFor="water_temperature">{t("waterTemperature")}</Label>
                  <Input
                    id="water_temperature"
                    type="number"
                    min={70}
                    max={100}
                    value={form.water_temperature ?? ""}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        water_temperature: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder={t("waterTemperaturePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brew_method">{t("brewMethod")}</Label>
                <Input
                  id="brew_method"
                  value={form.brew_method}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, brew_method: e.target.value }))
                  }
                  placeholder={t("brewMethodPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cupping_score">{t("scoreOrImpression")}</Label>
                <Input
                  id="cupping_score"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.cupping_score ?? ""}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      cupping_score: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder={t("scorePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">{t("notes")}</Label>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
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
                {record.grind_size && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("grind")} : {record.grind_size}
                  </p>
                )}
                {record.water_temperature != null && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("waterTemp")} : {record.water_temperature}°C
                  </p>
                )}
                {record.brew_method && (
                  <p className="text-[var(--muted-foreground)]">
                    {t("brewMethodShort")} : {record.brew_method}
                  </p>
                )}
                {record.cupping_score != null && (
                  <p className="font-medium text-[var(--primary)]">
                    {t("score")} : {record.cupping_score}
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
    </div>
  );
}
