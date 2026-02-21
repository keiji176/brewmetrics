"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  Gauge,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bean-profiles", label: "Bean Profiles", icon: Coffee },
  { href: "/digital-twin", label: "Digital Twin", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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
          BrewMetrics
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
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          Coffee quality platform
        </p>
      </div>
    </aside>
  );
}
