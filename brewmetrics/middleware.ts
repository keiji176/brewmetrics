import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const PUBLIC_PATHS = ["login", "signup"];
const AUTH_CALLBACK = "/auth/callback";

const handleI18n = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/auth")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const response = handleI18n(request);

  if (response.status === 307 || response.status === 303) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  const pathWithoutLocale = segments.slice(1).join("/") || "";
  const isEnOrJa = locale === "en" || locale === "ja";
  const effectiveLocale = isEnOrJa ? locale : "en";
  const isPublic = PUBLIC_PATHS.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"));

  if (!user && !isPublic && isEnOrJa) {
    const redirect = new URL(`/${effectiveLocale}/login`, request.url);
    redirect.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isPublic && isEnOrJa) {
    return NextResponse.redirect(new URL(`/${effectiveLocale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|auth|.*\\..*).*)"],
};
