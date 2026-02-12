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
        toast.loading(t("autoAssigning"));

        const response = await fetch(`/api/org/jobs/${jobId}/auto-assign`, {
          method: "POST",
        });

        const data = await response.json();

        toast.dismiss();

        if (!response.ok || !data.success) {
          toast.error(data.error || "Auto-assign failed");
          return;
        }

        toast.success(`Assigned to ${data.driver.name}`);
        router.refresh();
      } catch (error) {
        toast.dismiss();
        console.error("Auto-assign error:", error);
        toast.error("Failed to auto-assign");
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
