"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("settings");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
          <CardDescription>{t("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">{t("settingsOptions")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
