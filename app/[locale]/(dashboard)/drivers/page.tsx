import { getTranslations } from 'next-intl/server';
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { RealtimeListener } from "@/components/realtime-listener";
import { DriverFilters } from "@/components/driver-filters";
import { TruckPlateBadge } from "@/components/truck-plate-badge";
import { getDriversWithStats } from "@/lib/queries";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; vehicleType?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations('drivers');
  const tCommon = await getTranslations('common');
  const drivers = await getDriversWithStats({
    search: params.search,
    vehicleType: params.vehicleType,
  });

  return (
    <div className="space-y-6">
      {/* Real-time updates */}
      <RealtimeListener table="drivers" />
      <RealtimeListener table="permits" />

      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Search and Filters */}
      <DriverFilters />

      {/* Drivers Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('vehicle')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('totalPermits')}</TableHead>
              <TableHead>{t('active')}</TableHead>
              <TableHead>{t('halted')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>{t('noDrivers')}</p>
                    {(params.search || params.vehicleType) && (
                      <p className="text-sm">
                        {tCommon('search')}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <TruckPlateBadge plate={driver.vehicle_plate} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{driver.vehicle_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {driver.permitCounts.total}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {driver.permitCounts.active > 0 ? (
                      <Badge className="bg-green-600">
                        {driver.permitCounts.active}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.permitCounts.halted > 0 ? (
                      <Badge variant="destructive">
                        {driver.permitCounts.halted}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      {drivers.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>
            {tCommon('showing')}{" "}
            <span className="font-medium text-foreground">{drivers.length}</span>{" "}
            {drivers.length === 1 ? tCommon('driver') : tCommon('drivers')}
          </div>
          <div>•</div>
          <div>
            {t('totalPermitsLabel')}:{" "}
            <span className="font-medium text-foreground">
              {drivers.reduce((sum, d) => sum + d.permitCounts.total, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
