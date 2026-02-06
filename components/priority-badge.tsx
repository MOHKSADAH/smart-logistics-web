import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variants = {
    EMERGENCY: "bg-red-100 text-red-700 border-red-300",
    ESSENTIAL: "bg-amber-100 text-amber-700 border-amber-300",
    NORMAL: "bg-blue-100 text-blue-700 border-blue-300",
    LOW: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <Badge variant="outline" className={variants[priority]}>
      {priority}
    </Badge>
  );
}
