"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoastingRecordRow } from "@/lib/supabase/types";
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

const emptyRecord = (userId: string): Omit<RoastingRecordRow, "id" | "created_at"> => ({
  user_id: userId,
  bean_name: "",
  roast_temperature: null,
  roast_time: null,
  grind_size: "",
  extraction_time: null,
  cupping_score: null,
});

export default function BeanProfilesPage() {
  const [records, setRecords] = useState<RoastingRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoastingRecordRow | null>(null);
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
      .from("roasting_records")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setRecords((data as RoastingRecordRow[]) ?? []);
      });
  }, [supabase, userId]);

  function openCreate() {
    setEditing(null);
    setForm(userId ? emptyRecord(userId) : emptyRecord(""));
    setDialogOpen(true);
  }

  function openEdit(record: RoastingRecordRow) {
    setEditing(record);
    setForm({
      user_id: record.user_id,
      bean_name: record.bean_name ?? "",
      roast_temperature: record.roast_temperature,
      roast_time: record.roast_time,
      grind_size: record.grind_size ?? "",
      extraction_time: record.extraction_time,
      cupping_score: record.cupping_score,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    const payload = {
      bean_name: form.bean_name || null,
      roast_temperature: form.roast_temperature != null ? Number(form.roast_temperature) : null,
      roast_time: form.roast_time != null ? Number(form.roast_time) : null,
      grind_size: form.grind_size || null,
      extraction_time: form.extraction_time != null ? Number(form.extraction_time) : null,
      cupping_score: form.cupping_score != null ? Number(form.cupping_score) : null,
    };
    if (editing) {
      const { error: e } = await supabase
        .from("roasting_records")
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
        .from("roasting_records")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
      setSaving(false);
      if (e) {
        setError(e.message);
        return;
      }
      if (data) setRecords((prev) => [data as RoastingRecordRow, ...prev]);
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!supabase || !confirm("Delete this roasting record?")) return;
    const { error: e } = await supabase.from("roasting_records").delete().eq("id", id);
    if (e) setError(e.message);
    else setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
            Bean Profiles
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Create, edit, and manage your roasting records
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={!userId}>
            <Plus className="h-4 w-4" />
            Add record
          </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit record" : "New roasting record"}</DialogTitle>
              <DialogDescription>Fields are optional.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bean_name">Bean name</Label>
                  <Input
                    id="bean_name"
                    value={form.bean_name ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, bean_name: e.target.value }))}
                    placeholder="e.g. Ethiopia Yirgacheffe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roast_temperature">Roast temp (°C)</Label>
                    <Input
                      id="roast_temperature"
                      type="number"
                      min={180}
                      max={230}
                      value={form.roast_temperature ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          roast_temperature: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="205"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="roast_time">Roast time (min)</Label>
                    <Input
                      id="roast_time"
                      type="number"
                      min={0}
                      step={0.5}
                      value={form.roast_time ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          roast_time: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="grind_size">Grind size</Label>
                  <Input
                    id="grind_size"
                    value={form.grind_size ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, grind_size: e.target.value }))}
                    placeholder="e.g. medium-fine"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="extraction_time">Extraction time (s)</Label>
                    <Input
                      id="extraction_time"
                      type="number"
                      min={0}
                      value={form.extraction_time ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          extraction_time: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="28"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cupping_score">Cupping score</Label>
                    <Input
                      id="cupping_score"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={form.cupping_score ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          cupping_score: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="85"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : editing ? (
                    "Save"
                  ) : (
                    "Create"
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
            <p className="mt-4 font-medium text-[var(--foreground)]">No roasting records yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Add your first record to start tracking quality.
            </p>
            <Button className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-[var(--gray-dark)]">
                  {record.bean_name || "Unnamed"}
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
                {record.roast_temperature != null && (
                  <p className="text-[var(--muted-foreground)]">
                    Temp: {record.roast_temperature}°C
                  </p>
                )}
                {record.roast_time != null && (
                  <p className="text-[var(--muted-foreground)]">Time: {record.roast_time} min</p>
                )}
                {record.grind_size && (
                  <p className="text-[var(--muted-foreground)]">Grind: {record.grind_size}</p>
                )}
                {record.extraction_time != null && (
                  <p className="text-[var(--muted-foreground)]">
                    Extraction: {record.extraction_time}s
                  </p>
                )}
                {record.cupping_score != null && (
                  <p className="font-medium text-[var(--primary)]">
                    Cupping: {record.cupping_score}
                  </p>
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
