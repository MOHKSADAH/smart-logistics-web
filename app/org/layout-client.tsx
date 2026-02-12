"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { Suspense } from "react";

function LayoutContent({
  session,
  children
}: {
  session: any;
  children: React.ReactNode
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?lang=${newLocale}`);
  };

  const handleLogout = async () => {
    await fetch("/api/org/auth/login", { method: "DELETE" });
    router.push("/org-login");
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{session.organization_name}</h1>
            <p className="text-sm text-gray-600">{session.email}</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href={`/org?lang=${locale}`}>
              <Button variant="ghost">{t("dashboard")}</Button>
            </Link>
            <Link href={`/org/jobs?lang=${locale}`}>
              <Button variant="ghost">{t("jobs")}</Button>
            </Link>
            <Link href={`/org/drivers?lang=${locale}`}>
              <Button variant="ghost">{t("drivers")}</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {locale === "en" ? "العربية" : "English"}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              {t("logout")}
            </Button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}

export function OrgLayoutClient({ session, children }: { session: any; children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <LayoutContent session={session}>{children}</LayoutContent>
    </Suspense>
  );
}
