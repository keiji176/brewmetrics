import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const { Link, useRouter, usePathname } =
  createSharedPathnamesNavigation({
    locales: ["en", "ja"]
  });
