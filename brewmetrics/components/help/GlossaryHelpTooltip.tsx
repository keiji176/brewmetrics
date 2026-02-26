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
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={buttonLabel}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 -m-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--primary)]"
        >
          <CircleHelp className="h-4 w-4" />
          <span className="sr-only">{buttonLabel}</span>
        </Link>
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
