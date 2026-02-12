"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>((searchParams.get("lang") as Locale) || "en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/org/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/org?lang=${locale}`);
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    }

    setLoading(false);
  };

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
    router.push(`/org-login?lang=${newLocale}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">{t("loginTitle")}</CardTitle>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {locale === "en" ? "العربية" : "English"}
            </Button>
          </div>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@smsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("loggingIn") : t("loginButton")}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 border rounded text-sm">
            <p className="font-semibold mb-2 text-foreground">{t("demoCredentials")}:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("manager@smsa.com");
                  setPassword("demo1234");
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <strong>SMSA Express:</strong> manager@smsa.com / demo1234
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("dispatch@aramex.com");
                  setPassword("demo1234");
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <strong>Aramex:</strong> dispatch@aramex.com / demo1234
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("ops@naqel.com");
                  setPassword("demo1234");
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <strong>Naqel Express:</strong> ops@naqel.com / demo1234
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrganizationLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
