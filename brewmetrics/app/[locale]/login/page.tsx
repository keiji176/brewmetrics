"use client";

import { Suspense, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizeRedirectPath(path: string) {
    const safePath = path.startsWith("/") ? path : `/${path}`;
    const segments = safePath.split("/").filter(Boolean);
    if (segments.length > 0 && (segments[0] === "en" || segments[0] === "ja")) {
      const rest = segments.slice(1).join("/");
      return rest ? `/${rest}` : "/";
    }
    return safePath;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError(t("notConfigured"));
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(normalizeRedirectPath(redirectTo));
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream-muted)] px-4">
      <Card className="w-full max-w-md border-[var(--border)] shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--coffee-700)] text-[var(--cream)]">
            <Coffee className="h-6 w-6" />
          </Link>
          <CardTitle className="text-2xl font-semibold text-[var(--gray-dark)]">{tCommon("appName")}</CardTitle>
          <CardDescription>{t("signInToAccount")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-[var(--border)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                {t("password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="border-[var(--border)] pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("signingIn") : t("signIn")}
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {t("noAccount")}{" "}
              <Link href="/signup" className="font-medium text-[var(--primary)] hover:underline">
                {t("signUp")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
