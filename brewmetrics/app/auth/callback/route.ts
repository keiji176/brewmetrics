import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const LOCALES = ["en", "ja"] as const;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      const hasLocale = LOCALES.some((l) => next === `/${l}` || next.startsWith(`/${l}/`));
      if (!hasLocale) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", user.id)
          .single();
        const locale = profile?.language === "ja" ? "ja" : "en";
        next = next === "/" ? `/${locale}` : `/${locale}${next}`;
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const locale = "en";
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
