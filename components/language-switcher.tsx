"use client";

import { useRouter, usePathname } from "@/lib/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = () => {
    const newLocale = currentLocale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={switchLocale}
      className="font-medium"
    >
      {currentLocale === "en" ? "العربية" : "English"}
    </Button>
  );
}
