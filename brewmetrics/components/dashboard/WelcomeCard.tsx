import { Link } from "@/i18n/navigation";
import { Coffee } from "lucide-react";

interface WelcomeCardProps {
  title: string;
  line1: string;
  line2: string;
  cta: string;
}

export function WelcomeCard({ title, line1, line2, cta }: WelcomeCardProps) {
  return (
    <section className="animate-fade-in rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-800">
            <Coffee className="h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          </div>
          <p className="text-sm leading-relaxed text-amber-700">
            {line1}
            <br />
            {line2}
          </p>
        </div>

        <Link
          href="/bean-profiles"
          className="shrink-0 text-sm font-medium text-amber-800 underline-offset-4 transition hover:underline"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
