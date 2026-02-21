"use client";

import NextLink from "next/link";
import { usePathname as nextUsePathname, useRouter as nextUseRouter, useParams } from "next/navigation";
import type { ComponentProps } from "react";

function getPathWithoutLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|ja)(\/|$)/);
  return match ? (match[2] === "/" ? pathname.slice(match[1].length + 2) : "/") : pathname || "/";
}

export function usePathname(): string {
  const pathname = nextUsePathname() ?? "";
  return getPathWithoutLocale(pathname);
}

export function useRouter() {
  const nextRouter = nextUseRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  function toLocalePath(href: string, targetLocale: string): string {
    const path = href.startsWith("/") ? href : `/${href}`;
    if (/^\/(en|ja)(\/|$)/.test(path)) return path;
    return path === "/" ? `/${targetLocale}` : `/${targetLocale}${path}`;
  }

  return {
    push(href: string) {
      nextRouter.push(toLocalePath(href, locale));
    },
    replace(href: string, opts?: { locale?: string }) {
      const targetLocale = opts?.locale ?? locale;
      nextRouter.replace(toLocalePath(href, targetLocale));
    },
    refresh() {
      nextRouter.refresh();
    },
  };
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

export function Link({ href, ...rest }: LinkProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const localeHref = href === "/" || href === "" ? `/${locale}` : `/${locale}${href}`;
  return <NextLink href={localeHref} {...rest} />;
}
