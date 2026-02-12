"use client";

import { useEffect } from "react";

export function LocaleWrapper({
  locale,
  direction,
  children,
}: {
  locale: string;
  direction: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Update HTML element attributes
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", direction);
  }, [locale, direction]);

  return <>{children}</>;
}
