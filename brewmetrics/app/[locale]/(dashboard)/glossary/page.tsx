"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { GlossaryCard } from "@/components/glossary/GlossaryCard";
import { glossaryTerms } from "@/lib/glossary-data";
import { useTranslations } from "next-intl";

export default function GlossaryPage() {
  const t = useTranslations("glossary");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return glossaryTerms;
    return glossaryTerms.filter((term) => {
      const plain = `${term.term} ${term.short} ${term.explanation}`.toLowerCase();
      return plain.includes(keyword);
    });
  }, [query]);

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
            <GlossaryCard key={term.id} term={term} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
