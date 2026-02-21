"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Coffee,
  Gauge,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "nav.dashboard" as const, icon: LayoutDashboard },
  { href: "/bean-profiles", labelKey: "nav.beanProfiles" as const, icon: Coffee },
  { href: "/digital-twin", labelKey: "nav.digitalTwin" as const, icon: Gauge },
  { href: "/settings", labelKey: "nav.settings" as const, icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
              <span className="font-semibold text-[var(--gray-dark)]">{t("common.appName")}</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-0.5 p-4">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
