"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "next-intl";

type GearItem = {
  name: string;
  category: string;
  priceRange: string;
  bestFor: string;
  note: string;
};

function getGearItems(locale: string): GearItem[] {
  if (locale === "ja") {
    return [
      {
        name: "HARIO V60",
        category: "ドリッパー",
        priceRange: "¥¥",
        bestFor: "クリアで香りの立つ一杯",
        note: "抽出速度をコントロールしやすく、定番のハンドドリップ器具です。",
      },
      {
        name: "Kalita Wave",
        category: "ドリッパー",
        priceRange: "¥¥",
        bestFor: "安定した抽出",
        note: "フラットボトム構造で、初心者でも味の再現性を出しやすいです。",
      },
      {
        name: "TIMEMORE C2/C3",
        category: "グラインダー",
        priceRange: "¥¥",
        bestFor: "コスパ重視で均一な挽き目",
        note: "ホームバリスタ向けの人気ハンドミル。粒度調整がしやすいです。",
      },
      {
        name: "Comandante C40",
        category: "グラインダー",
        priceRange: "¥¥¥",
        bestFor: "高精度な抽出",
        note: "粒度の均一性が高く、繊細な味の違いを出しやすい上級者向け。",
      },
      {
        name: "HARIO Drip Scale",
        category: "スケール",
        priceRange: "¥¥",
        bestFor: "抽出時間と湯量の管理",
        note: "タイマー付きで注湯レシピを再現しやすい基本の一台です。",
      },
      {
        name: "Fellow Stagg EKG",
        category: "ケトル",
        priceRange: "¥¥¥",
        bestFor: "湯温を正確に管理",
        note: "温度設定と細口注湯で、安定したハンドドリップに向いています。",
      },
    ];
  }

  return [
    {
      name: "HARIO V60",
      category: "Dripper",
      priceRange: "¥¥",
      bestFor: "Clean and aromatic cups",
      note: "Classic pour-over dripper with high control over flow and extraction speed.",
    },
    {
      name: "Kalita Wave",
      category: "Dripper",
      priceRange: "¥¥",
      bestFor: "Consistent brewing",
      note: "Flat-bottom design helps beginners produce stable, repeatable results.",
    },
    {
      name: "TIMEMORE C2/C3",
      category: "Grinder",
      priceRange: "¥¥",
      bestFor: "Great value and uniform grinding",
      note: "Popular manual grinder for home baristas with easy grind-size adjustment.",
    },
    {
      name: "Comandante C40",
      category: "Grinder",
      priceRange: "¥¥¥",
      bestFor: "High-precision brews",
      note: "Excellent grind consistency for extracting subtle flavor differences.",
    },
    {
      name: "HARIO Drip Scale",
      category: "Scale",
      priceRange: "¥¥",
      bestFor: "Tracking dose and brew time",
      note: "Timer-enabled scale that makes recipes easy to reproduce.",
    },
    {
      name: "Fellow Stagg EKG",
      category: "Kettle",
      priceRange: "¥¥¥",
      bestFor: "Precise temperature control",
      note: "Temperature control and gooseneck pouring for stable hand brewing.",
    },
  ];
}

export default function GearGuidePage() {
  const t = useTranslations("gearGuide");
  const locale = useLocale();
  const items = getGearItems(locale);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.name} className="h-full">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary">{item.category}</Badge>
                <span className="text-sm font-medium text-[var(--primary)]">{item.priceRange}</span>
              </div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.bestFor}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
