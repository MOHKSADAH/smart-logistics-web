import { Badge } from "@/components/ui/badge";

interface TrafficStatusBadgeProps {
  status: "NORMAL" | "MODERATE" | "CONGESTED";
}

export function TrafficStatusBadge({ status }: TrafficStatusBadgeProps) {
  const variants = {
    NORMAL: "bg-green-100 text-green-800 hover:bg-green-100",
    MODERATE: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    CONGESTED: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  const labels = {
    NORMAL: "Normal",
    MODERATE: "Moderate",
    CONGESTED: "Congested",
  };

  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
