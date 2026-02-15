import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface TrafficStatusBadgeProps {
  status: "NORMAL" | "MODERATE" | "CONGESTED";
}

export function TrafficStatusBadge({ status }: TrafficStatusBadgeProps) {
  const t = useTranslations("status");

  const variants = {
    NORMAL: "bg-green-100 text-green-800 hover:bg-green-100",
    MODERATE: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    CONGESTED: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  const statusKeys: Record<string, string> = {
    NORMAL: "normal",
    MODERATE: "moderate",
    CONGESTED: "congested",
  };

  return (
    <Badge className={variants[status]}>
      {t(statusKeys[status])}
    </Badge>
  );
}
