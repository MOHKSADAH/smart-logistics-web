"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";

interface DeleteJobButtonProps {
  jobId: string;
  jobNumber: string;
}

export function DeleteJobButton({ jobId, jobNumber }: DeleteJobButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/org/jobs/${jobId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.error || "Failed to delete job");
          return;
        }

        toast.success(t("jobDeleted"));
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete job");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteJob")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{t("confirmDelete")}</p>
            <p className="font-semibold text-gray-900">
              {jobNumber}
            </p>
            <p className="text-red-600">{t("deleteWarning")}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : t("deleteJob")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
