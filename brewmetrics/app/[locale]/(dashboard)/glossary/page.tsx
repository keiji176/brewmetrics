"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type SearchScope = "all" | "term" | "description";

export default function GlossaryPage() {
  const t = useTranslations("glossary");
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");

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
      if (searchScope === "term") {
        return term.term.toLowerCase().includes(keyword);
      }

      if (searchScope === "description") {
        return `${term.short} ${term.explanation}`.toLowerCase().includes(keyword);
      }

      const plain = `${term.term} ${term.short} ${term.explanation}`.toLowerCase();
      return plain.includes(keyword);
    });
  }, [query, searchScope, terms]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
          <div className="space-y-1.5">
            <Label htmlFor="glossary-search-scope" className="text-xs text-[var(--muted-foreground)]">
              {t("searchScopeLabel")}
            </Label>
            <select
              id="glossary-search-scope"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as SearchScope)}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="all">{t("searchAll")}</option>
              <option value="term">{t("searchTerm")}</option>
              <option value="description">{t("searchDescription")}</option>
            </select>
          </div>
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
