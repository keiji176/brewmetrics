"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Coffee,
  FileText,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    headingKey: "nav.mainActions" as const,
    items: [
      { href: "/", labelKey: "nav.dashboard" as const, icon: LayoutDashboard },
      { href: "/brew-records", labelKey: "nav.brewRecords" as const, icon: FileText },
    ],
  },
  {
    headingKey: "nav.dataSub" as const,
    items: [
      { href: "/bean-profiles", labelKey: "nav.beanProfiles" as const, icon: Coffee },
      { href: "/gear-guide", labelKey: "nav.myGear" as const, icon: Wrench },
    ],
  },
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
      <nav className="flex-1 space-y-4 p-4">
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.headingKey}
            className={cn(
              "space-y-1.5",
              groupIndex > 0 && "border-t border-[var(--border)] pt-4"
            )}
          >
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {t(group.headingKey)}
            </p>
            {group.items.map((item, itemIndex) => {
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
                  style={{ animationDelay: `${(groupIndex * 2 + itemIndex) * 50}ms` }}
                >
                  <item.icon
                    className={cn("h-5 w-5 shrink-0", isActive && "text-[var(--primary)]")}
                  />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          {t("nav.coffeeQualityPlatform")}
        </p>
      </div>
    </aside>
  );
}
