"use client";

import { CircleHelp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlossaryHelpTooltipProps {
  href: string;
  description: string;
  buttonLabel: string;
  learnMoreLabel: string;
}

export function GlossaryHelpTooltip({
  href,
  description,
  buttonLabel,
  learnMoreLabel,
}: GlossaryHelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={buttonLabel}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--primary)]"
        >
          <CircleHelp className="h-4 w-4" />
          <span className="sr-only">{buttonLabel}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-2">
          <p className="leading-relaxed text-[var(--foreground)]">{description}</p>
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline-offset-2 hover:underline"
          >
            {learnMoreLabel}
          </Link>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
