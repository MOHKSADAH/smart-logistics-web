"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export function PermitFilters() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/permits?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("common.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.status")}</SelectItem>
          <SelectItem value="APPROVED">{t("status.approved")}</SelectItem>
          <SelectItem value="HALTED">{t("status.halted")}</SelectItem>
          <SelectItem value="PENDING">{t("status.pending")}</SelectItem>
          <SelectItem value="CANCELLED">{t("status.cancelled")}</SelectItem>
          <SelectItem value="EXPIRED">{t("status.expired")}</SelectItem>
          <SelectItem value="COMPLETED">{t("status.completed")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") || "all"}
        onValueChange={(value) => handleFilterChange("priority", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("permits.priority")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("permits.priority")}</SelectItem>
          <SelectItem value="EMERGENCY">{t("priority.emergency")}</SelectItem>
          <SelectItem value="ESSENTIAL">{t("priority.essential")}</SelectItem>
          <SelectItem value="NORMAL">{t("priority.normal")}</SelectItem>
          <SelectItem value="LOW">{t("priority.low")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
