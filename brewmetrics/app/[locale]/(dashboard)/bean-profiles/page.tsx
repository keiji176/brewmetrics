"use client";

import { useEffect, useState } from "react";
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
import { Coffee, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const emptyRecord = (userId: string): Omit<BeanProfileRow, "id" | "created_at"> => ({
  user_id: userId,
  bean_name: "",
  roaster: "",
  origin: "",
  roast_level: "",
  process: "",
});

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
    const payload = {
      bean_name: form.bean_name || null,
      roaster: form.roaster || null,
      origin: form.origin || null,
      roast_level: form.roast_level || null,
      process: form.process || null,
    };
    if (editing) {
      const { error: e } = await supabase
        .from("bean_profiles")
        .update(payload)
        .eq("id", editing.id);
      setSaving(false);
      if (e) {
        setError(e.message);
        return;
      }
      setRecords((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r))
      );
    } else {
      const { data, error: e } = await supabase
        .from("bean_profiles")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-[var(--gray-dark)]">
                  {record.bean_name || t("unnamed")}
                </CardTitle>
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
      )}
    </div>
  );
}
