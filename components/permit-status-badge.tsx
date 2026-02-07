'use client';

import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

interface PermitStatusBadgeProps {
  status:
    | "PENDING"
    | "APPROVED"
    | "HALTED"
    | "CANCELLED"
    | "EXPIRED"
    | "COMPLETED";
}

export function PermitStatusBadge({ status }: PermitStatusBadgeProps) {
  const t = useTranslations('status');

  const variants = {
    APPROVED: "bg-green-100 text-green-800 hover:bg-green-100",
    HALTED: "bg-red-100 text-red-800 hover:bg-red-100",
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    CANCELLED: "bg-gray-100 text-gray-600 hover:bg-gray-100 line-through",
    EXPIRED: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    COMPLETED: "bg-green-50 text-green-700 border-green-300",
  };

  const variant = status === "COMPLETED" ? "outline" : "default";

  return (
    <Badge variant={variant} className={variants[status]}>
      {t(status.toLowerCase())}
    </Badge>
  );
}
