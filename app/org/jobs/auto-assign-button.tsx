"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";

export function AutoAssignButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";
  const [isPending, startTransition] = useTransition();

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const handleAutoAssign = () => {
    startTransition(async () => {
      try {
        console.log("[AUTO-ASSIGN] Starting for job:", jobId);
        toast.loading(t("autoAssigning"));

        const response = await fetch(`/api/org/jobs/${jobId}/auto-assign`, {
          method: "POST",
        });

        console.log("[AUTO-ASSIGN] Response status:", response.status);
        const responseText = await response.text();
        console.log("[AUTO-ASSIGN] Response text:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("[AUTO-ASSIGN] Response data:", data);
        } catch (e) {
          console.error("[AUTO-ASSIGN] Failed to parse JSON:", e);
          toast.error(`Server error: ${responseText.substring(0, 100)}`);
          return;
        }

        toast.dismiss();

        if (!response.ok || !data.success) {
          console.error("[AUTO-ASSIGN] Failed:", data);
          toast.error(data.error || data.message || "Auto-assign failed");
          return;
        }

        toast.success(`Assigned to ${data.driver.name} - Permit: ${data.permit.permit_code}`);

        // Force hard refresh to ensure server component re-renders with new data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        toast.dismiss();
        console.error("[AUTO-ASSIGN] Exception:", error);
        toast.error(error instanceof Error ? error.message : "Failed to auto-assign");
      }
    });
  };

  return (
    <Button
      onClick={handleAutoAssign}
      disabled={isPending}
      size="sm"
      variant="secondary"
    >
      <Zap className="h-3 w-3 me-1" />
      {isPending ? t("autoAssigning") : t("autoAssign")}
    </Button>
  );
}
