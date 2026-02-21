"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { GlossaryCard } from "@/components/glossary/GlossaryCard";
import { useTranslations } from "next-intl";

const termIds = [
  "acidity",
  "body",
  "bloom",
  "brewRatio",
  "cupping",
  "extraction",
  "extractionYield",
  "grindSize",
  "tds",
  "underOver",
] as const;

type GlossaryEntry = {
  id: string;
  term: string;
  short: string;
  explanation: string;
  tip: string;
};

export default function GlossaryPage() {
  const t = useTranslations("glossary");
  const [query, setQuery] = useState("");

  const terms = useMemo<GlossaryEntry[]>(
    () =>
      termIds.map((id) => ({
        id,
        term: t(`terms.${id}.term`),
        short: t(`terms.${id}.short`),
        explanation: t(`terms.${id}.explanation`),
        tip: t(`terms.${id}.tip`),
      })),
    [t]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return terms;
    return terms.filter((term) => {
      const plain = `${term.term} ${term.short} ${term.explanation}`.toLowerCase();
      return plain.includes(keyword);
    });
  }, [query, terms]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        <div className="max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
          {t("noResults")}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((term, index) => (
            <GlossaryCard
              key={term.id}
              term={term}
              index={index}
              quickTipLabel={t("quickTip")}
              toggleTipLabel={t("toggleTip")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
