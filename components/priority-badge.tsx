"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface PriorityBadgeProps {
  priority: "EMERGENCY" | "TIME_SENSITIVE" | "ESSENTIAL" | "NORMAL" | "LOW";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const t = useTranslations("priority");

  const variants = {
    EMERGENCY: "bg-red-100 text-red-700 border-red-300",
    TIME_SENSITIVE: "bg-orange-100 text-orange-700 border-orange-300",
    ESSENTIAL: "bg-amber-100 text-amber-700 border-amber-300",
    NORMAL: "bg-blue-100 text-blue-700 border-blue-300",
    LOW: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <Badge variant="outline" className={variants[priority]}>
      {t(priority.toLowerCase())}
    </Badge>
  );
}
