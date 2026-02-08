import { formatSaudiTruckPlate } from '@/lib/plate-utils';

interface TruckPlateBadgeProps {
  plate: string;
  className?: string;
}

export function TruckPlateBadge({ plate, className = '' }: TruckPlateBadgeProps) {
  if (!plate) return null;

  const formattedPlate = formatSaudiTruckPlate(plate);

  return (
    <span className={`font-mono text-xs text-muted-foreground ${className}`}>
      {formattedPlate}
    </span>
  );
}
