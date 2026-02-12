"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";

interface BulkAutoAssignButtonProps {
  hasPendingJobs: boolean;
}

export function BulkAutoAssignButton({ hasPendingJobs }: BulkAutoAssignButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const handleBulkAssign = () => {
    startTransition(async () => {
      try {
        toast.loading(t("assigningJobs"));

        const response = await fetch("/api/org/jobs/bulk-auto-assign", {
          method: "POST",
        });

        const data = await response.json();

        toast.dismiss();

        if (!response.ok || !data.success) {
          toast.error(data.error || "Failed to assign jobs");
          return;
        }

        if (data.assigned === 0) {
          toast.info(t("noJobsToAssign"));
        } else {
          // Replace {count} with actual number in translation
          const message = t("jobsAssigned").replace("{count}", data.assigned.toString());
          toast.success(message);

          if (data.failed > 0) {
            toast.warning(`${data.failed} jobs could not be assigned`);
          }
        }

        router.refresh();
      } catch (error) {
        toast.dismiss();
        console.error("Bulk assign error:", error);
        toast.error("Failed to assign jobs");
      }
    });
  };

  return (
    <Button
      onClick={handleBulkAssign}
      disabled={isPending || !hasPendingJobs}
      variant="secondary"
    >
      <Zap className="h-4 w-4 me-2" />
      {t("autoAssignAll")}
    </Button>
  );
}
