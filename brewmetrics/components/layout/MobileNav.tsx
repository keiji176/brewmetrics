"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Coffee,
  FileText,
  Wrench,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileMenu = (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed left-0 top-0 z-50 isolate flex h-dvh w-64 flex-col border-r border-[var(--border)] !bg-[var(--background)] text-[var(--foreground)] opacity-100 shadow-2xl lg:hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="font-semibold text-[var(--gray-dark)]">{t("common.appName")}</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-4">
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
              {group.items.map((item) => {
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
            </div>
          ))}
        </nav>
      </div>
    </>
  );

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
      {open && mounted ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
