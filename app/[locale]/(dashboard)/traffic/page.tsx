import { getTranslations } from 'next-intl/server';
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { TrafficStatusBadge } from "@/components/traffic-status-badge";
import { TrafficChart } from "@/components/traffic-chart";
import { RealtimeListener } from "@/components/realtime-listener";
import { getTrafficData } from "@/lib/queries";

export default async function TrafficPage() {
  const t = await getTranslations('traffic');
  const tCommon = await getTranslations('common');
  const traffic = await getTrafficData();
  const recentUpdates = traffic.history.slice(-20).reverse();

  return (
    <div className="space-y-6">
      {/* Real-time updates */}
      <RealtimeListener table="traffic_updates" />

      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Current Status Banner */}
      {traffic.current && (
        <Card
          className={
            traffic.current.status === "CONGESTED"
              ? "bg-red-50 border-red-200"
              : traffic.current.status === "MODERATE"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
          }
        >
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('currentStatus')}</h2>
              <div className="flex items-center gap-6">
                <TrafficStatusBadge status={traffic.current.status} />
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('vehicleCount')}:</span>{" "}
                    <span className="font-semibold">
                      {traffic.current.vehicle_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('truckCount')}:</span>{" "}
                    <span className="font-semibold">
                      {traffic.current.truck_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Camera:</span>{" "}
                    <span className="font-mono text-xs">
                      {traffic.current.camera_id}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Updated{" "}
                    {formatDistanceToNow(new Date(traffic.current.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Chart */}
      <TrafficChart data={traffic.history} />

      {/* Recent Updates Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('historicalTrends')}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Camera ID</TableHead>
                <TableHead>{t('currentStatus')}</TableHead>
                <TableHead>{t('vehicleCount')}</TableHead>
                <TableHead>{t('truckCount')}</TableHead>
                <TableHead>{t('recommendation')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUpdates.map((update) => (
                <TableRow key={update.id}>
                  <TableCell className="text-sm">
                    {format(new Date(update.timestamp), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {update.camera_id}
                  </TableCell>
                  <TableCell>
                    <TrafficStatusBadge status={update.status} />
                  </TableCell>
                  <TableCell>{update.vehicle_count}</TableCell>
                  <TableCell>{update.truck_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {update.recommendation || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
