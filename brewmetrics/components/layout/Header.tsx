"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./MobileNav";
import { createClient } from "@/lib/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const [user, setUser] = useState<AuthUser | null>(null);
  const currentPath = pathname || "/";

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleLocaleChange(newLocale: "en" | "ja") {
    if (locale === newLocale) return;
    const supabase = createClient();
    if (supabase && user) {
      await supabase.from("profiles").update({ language: newLocale }).eq("id", user.id);
    }
    router.replace(currentPath, { locale: newLocale });
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <MobileNav />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-1 py-0.5">
          <a
            href={`/en${currentPath === "/" ? "" : currentPath}`}
            onClick={(e) => {
              e.preventDefault();
              handleLocaleChange("en");
            }}
            className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
              locale === "en"
                ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            EN
          </a>
          <span className="text-[var(--border)]">|</span>
          <a
            href={`/ja${currentPath === "/" ? "" : currentPath}`}
            onClick={(e) => {
              e.preventDefault();
              handleLocaleChange("ja");
            }}
            className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
              locale === "ja"
                ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            日本語
          </a>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]">
                <User className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <span className="hidden max-w-[120px] truncate text-[var(--foreground)] sm:inline-block">
                {user?.email ?? t("account")}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm text-[var(--muted-foreground)]">
              {user?.email}
            </div>
            <DropdownMenuItem asChild>
              <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
