"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary-data";
import { cn } from "@/lib/utils";

interface GlossaryCardProps {
  term: GlossaryTerm;
  index: number;
}

export function GlossaryCard({ term, index }: GlossaryCardProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[var(--coffee-300)]",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--gray-dark)]">
            {term.term}
          </h3>
          {term.tip && (
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="rounded-full p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--primary)]"
              aria-label="Toggle tip"
              title="Quick tip"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm font-medium text-[var(--primary)]">{term.short}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {term.explanation}
        </p>
        {term.tip && showTip && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--cream-muted)] px-3 py-2">
            <p className="text-xs font-medium text-[var(--primary)]">Quick tip</p>
            <p className="text-sm text-[var(--foreground)]">{term.tip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
