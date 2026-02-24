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
  "flavorNotes",
  "grindSize",
  "roasting",
  "tds",
  "underOver",
  "arabica",
  "robusta",
  "geisha",
  "typica",
  "bourbon",
  "caturra",
  "pacamara",
] as const;

type GlossaryEntry = {
  id: string;
  term: string;
  category: string;
  short: string;
  explanation: string;
  tip: string;
};

type SearchScope = "all" | "term" | "description";
type CategoryFilter = "all" | "basics" | "varieties";

export default function GlossaryPage() {
  const t = useTranslations("glossary");
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const terms = useMemo<GlossaryEntry[]>(
    () =>
      termIds.map((id) => ({
        id,
        term: t(`terms.${id}.term`),
        category: t.has(`terms.${id}.category`)
          ? t(`terms.${id}.category`)
          : t("categoryBasics"),
        short: t(`terms.${id}.short`),
        explanation: t(`terms.${id}.explanation`),
        tip: t(`terms.${id}.tip`),
      })),
    [t]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const withCategory =
      categoryFilter === "all"
        ? terms
        : terms.filter((term) =>
            categoryFilter === "basics"
              ? term.category === t("categoryBasics")
              : term.category === t("categoryVarietiesSpecies")
          );

    if (!keyword) return withCategory;

    return withCategory.filter((term) => {
      if (searchScope === "term") {
        return term.term.toLowerCase().includes(keyword);
      }

      if (searchScope === "description") {
        return `${term.short} ${term.explanation}`.toLowerCase().includes(keyword);
      }

      const plain = `${term.term} ${term.short} ${term.explanation}`.toLowerCase();
      return plain.includes(keyword);
    });
  }, [query, searchScope, categoryFilter, terms, t]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t("description")}</p>
        <div className="flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full md:flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <div className="w-full space-y-1.5 md:w-56">
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
          <div className="w-full space-y-1.5 md:w-64">
            <Label htmlFor="glossary-category-filter" className="text-xs text-[var(--muted-foreground)]">
              {t("categoryFilterLabel")}
            </Label>
            <select
              id="glossary-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="all">{t("categoryAllOption")}</option>
              <option value="basics">{t("categoryBasics")}</option>
              <option value="varieties">{t("categoryVarietiesSpecies")}</option>
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
