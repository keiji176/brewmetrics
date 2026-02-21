"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";

export function MemoForm() {
  const [memo, setMemo] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdvice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: memo || "No memo provided." }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAdvice(data.advice ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--gray-dark)]">
            <Bot className="h-5 w-5 text-[var(--primary)]" />
            Branch Memo
          </CardTitle>
          <CardDescription>
            Write a short note about today’s conditions or changes (e.g. humidity, grind, recipe). Then get AI advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g. Humidity is high today, adjusted grind size finer."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[120px] resize-y"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting advice…
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Get AI Advice
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-rose-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {advice && (
        <Card className="border-[var(--coffee-200)] bg-[var(--cream-muted)]/50">
          <CardHeader>
            <CardTitle className="text-base text-[var(--gray-dark)]">AI Advice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {advice}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
