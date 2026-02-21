"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Coffee,
  FileText,
  Gauge,
  Wrench,
  BookOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "nav.dashboard" as const, icon: LayoutDashboard },
  { href: "/bean-profiles", labelKey: "nav.beanProfiles" as const, icon: Coffee },
  { href: "/brew-records", labelKey: "nav.brewRecords" as const, icon: FileText },
  { href: "/digital-twin", labelKey: "nav.digitalTwin" as const, icon: Gauge },
  { href: "/gear-guide", labelKey: "nav.gearGuide" as const, icon: Wrench },
  { href: "/glossary", labelKey: "nav.glossary" as const, icon: BookOpen },
  { href: "/settings", labelKey: "nav.settings" as const, icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex"
      style={{ borderColor: "rgba(229, 221, 210, 0.6)" }}
    >
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--coffee-700)] text-[var(--cream)]">
          <Coffee className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("common.appName")}
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-[var(--primary)]")}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          {t("nav.coffeeQualityPlatform")}
        </p>
      </div>
    </aside>
  );
}
