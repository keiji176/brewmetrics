import { createNavigation } from "next-intl/routing";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
