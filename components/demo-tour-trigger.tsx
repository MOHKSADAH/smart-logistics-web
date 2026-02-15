"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { getTourSteps } from "@/lib/tour-config";

export function DemoTourTrigger() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if demo mode is enabled
    const isDemoMode = searchParams.get("demo") === "true";

    // Check if tour was already seen this session
    const tourSeen = sessionStorage.getItem("porta_demo_tour_seen");

    if (!isDemoMode || tourSeen) {
      return;
    }

    // Determine which tour to show based on pathname and language
    const isOrgDashboard = pathname.includes("/org");

    // Get locale: from search params for org dashboard, from pathname for admin dashboard
    let locale = "en";
    if (isOrgDashboard) {
      locale = searchParams.get("lang") || "en";
    } else {
      // Extract locale from pathname (e.g., /ar, /en)
      const pathSegments = pathname.split("/").filter(Boolean);
      if (pathSegments.length > 0 && (pathSegments[0] === "ar" || pathSegments[0] === "en")) {
        locale = pathSegments[0];
      }
    }

    const tourSteps = getTourSteps(isOrgDashboard, locale);

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        showButtons: locale === "ar" ? ["previous", "next", "close"] : ["next", "previous", "close"],
        steps: tourSteps,
        onDestroyStarted: () => {
          // When tour is closed/completed
          driverObj.destroy();

          // Mark tour as seen
          sessionStorage.setItem("porta_demo_tour_seen", "true");

          // Redirect to clean URL without ?demo=true
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete("demo");

          router.push(currentUrl.pathname + currentUrl.search);
        },
        nextBtnText: locale === "ar" ? "التالي →" : "Next →",
        prevBtnText: locale === "ar" ? "← السابق" : "← Back",
        doneBtnText: locale === "ar" ? "إنهاء الجولة ✓" : "Finish Tour ✓",
        progressText: locale === "ar" ? "{{current}} من {{total}}" : "{{current}} of {{total}}",
        popoverClass: locale === "ar" ? "porta-tour-popover porta-tour-rtl" : "porta-tour-popover",
      });

      driverObj.drive();
    }, 1000); // 1 second delay to ensure everything is loaded

    return () => clearTimeout(timer);
  }, [searchParams, pathname, router]);

  return null; // This component doesn't render anything
}
