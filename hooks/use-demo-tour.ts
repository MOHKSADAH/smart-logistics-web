"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { onTourComplete } from "@/lib/tour-config";

export function useDemoTour(steps: DriveStep[]) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Check if demo mode is enabled
    const isDemoMode = searchParams.get("demo") === "true";

    // Check if tour was already seen this session
    const tourSeen = sessionStorage.getItem("porta_demo_tour_seen");

    if (!isDemoMode || tourSeen) {
      return;
    }

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        steps: steps,
        onDestroyStarted: () => {
          // When tour is closed/completed
          driverObj.destroy();

          // Redirect to clean URL without ?demo=true
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete("demo");
          onTourComplete(currentUrl.toString());
        },
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Finish Tour ✓",
        progressText: "{{current}} of {{total}}",
        popoverClass: "porta-tour-popover",
      });

      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams, steps, pathname]);
}
