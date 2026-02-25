export type MyGearCatalogItem = {
  id: string;
  category: {
    ja: string;
    en: string;
  };
  name: {
    ja: string;
    en: string;
  };
  bestFor: {
    ja: string;
    en: string;
  };
  note: {
    ja: string;
    en: string;
  };
};

export type MyGearOption = {
  value: string;
  label: string;
};

const myGearCatalog: MyGearCatalogItem[] = [
  {
    id: "hario-v60",
    category: { ja: "ドリッパー", en: "Dripper" },
    name: { ja: "HARIO V60", en: "HARIO V60" },
    bestFor: { ja: "クリアで香りの立つ一杯", en: "Clean and aromatic cups" },
    note: {
      ja: "抽出速度をコントロールしやすく、定番のハンドドリップ器具です。",
      en: "Classic pour-over dripper with high control over flow and extraction speed.",
    },
  },
  {
    id: "kalita-wave",
    category: { ja: "ドリッパー", en: "Dripper" },
    name: { ja: "Kalita Wave", en: "Kalita Wave" },
    bestFor: { ja: "安定した抽出", en: "Consistent brewing" },
    note: {
      ja: "フラットボトム構造で、初心者でも味の再現性を出しやすいです。",
      en: "Flat-bottom design helps beginners produce stable, repeatable results.",
    },
  },
  {
    id: "timemore-c2-c3",
    category: { ja: "グラインダー", en: "Grinder" },
    name: { ja: "TIMEMORE C2/C3", en: "TIMEMORE C2/C3" },
    bestFor: { ja: "コスパ重視で均一な挽き目", en: "Great value and uniform grinding" },
    note: {
      ja: "ホームバリスタ向けの人気ハンドミル。粒度調整がしやすいです。",
      en: "Popular manual grinder for home baristas with easy grind-size adjustment.",
    },
  },
  {
    id: "comandante-c40",
    category: { ja: "グラインダー", en: "Grinder" },
    name: { ja: "Comandante C40", en: "Comandante C40" },
    bestFor: { ja: "高精度な抽出", en: "High-precision brews" },
    note: {
      ja: "粒度の均一性が高く、繊細な味の違いを出しやすい上級者向け。",
      en: "Excellent grind consistency for extracting subtle flavor differences.",
    },
  },
  {
    id: "hario-drip-scale",
    category: { ja: "スケール", en: "Scale" },
    name: { ja: "HARIO Drip Scale", en: "HARIO Drip Scale" },
    bestFor: { ja: "抽出時間と湯量の管理", en: "Tracking dose and brew time" },
    note: {
      ja: "タイマー付きで注湯レシピを再現しやすい基本の一台です。",
      en: "Timer-enabled scale that makes recipes easy to reproduce.",
    },
  },
  {
    id: "fellow-stagg-ekg",
    category: { ja: "ケトル", en: "Kettle" },
    name: { ja: "Fellow Stagg EKG", en: "Fellow Stagg EKG" },
    bestFor: { ja: "湯温を正確に管理", en: "Precise temperature control" },
    note: {
      ja: "温度設定と細口注湯で、安定したハンドドリップに向いています。",
      en: "Temperature control and gooseneck pouring for stable hand brewing.",
    },
  },
];

export function getMyGearCatalog(locale: string) {
  return myGearCatalog.map((item) => ({
    id: item.id,
    category: locale === "ja" ? item.category.ja : item.category.en,
    name: locale === "ja" ? item.name.ja : item.name.en,
    bestFor: locale === "ja" ? item.bestFor.ja : item.bestFor.en,
    note: locale === "ja" ? item.note.ja : item.note.en,
  }));
}

export function getMyGearOptions(selectedGearIds: string[], locale: string): MyGearOption[] {
  const selected = new Set(selectedGearIds);
  return getMyGearCatalog(locale)
    .filter((item) => selected.has(item.id))
    .map((item) => ({ value: item.id, label: item.name }));
}
