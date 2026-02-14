import { getTranslations } from 'next-intl/server';
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrafficHeatMap } from "@/components/traffic-heat-map";
import { RealtimeListener } from "@/components/realtime-listener";
import { getTrafficData, getVesselSchedules } from "@/lib/queries";
import { Ship } from "lucide-react";

// Aggregate traffic data by hour for heat map
function aggregateTrafficByHour(history: any[]) {
  const hourlyData = new Map<number, { totalVehicles: number; totalTrucks: number; statuses: string[]; count: number }>();

  // Initialize all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData.set(hour, { totalVehicles: 0, totalTrucks: 0, statuses: [], count: 0 });
  }

  // Aggregate data by hour
  history.forEach((record) => {
    const hour = new Date(record.timestamp).getHours();
    const data = hourlyData.get(hour)!;
    data.totalVehicles += record.vehicle_count || 0;
    data.totalTrucks += record.truck_count || 0;
    data.statuses.push(record.status);
    data.count++;
  });

  // Convert to heat map format
  return Array.from(hourlyData.entries()).map(([hour, data]) => {
    const avgVehicles = data.count > 0 ? Math.round(data.totalVehicles / data.count) : 0;
    const avgTrucks = data.count > 0 ? Math.round(data.totalTrucks / data.count) : 0;

    // Determine status based on average vehicle count
    let status: "NORMAL" | "MODERATE" | "CONGESTED" = "NORMAL";
    if (avgVehicles >= 150) status = "CONGESTED";
    else if (avgVehicles >= 100) status = "MODERATE";

    return {
      hour,
      status,
      vehicleCount: avgVehicles,
      truckCount: avgTrucks,
    };
  });
}

export default async function TrafficPage() {
  const t = await getTranslations('traffic');
  const tDashboard = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');

  const [traffic, vessels] = await Promise.all([
    getTrafficData(),
    getVesselSchedules(),
  ]);

  const recentUpdates = traffic.history.slice(-20).reverse();
  const upcomingVessels = vessels.slice(0, 5);

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
                    <span className="text-muted-foreground">{t('camera')}:</span>{" "}
                    <span className="font-mono text-xs">
                      {traffic.current.camera_id}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t('updated')}{" "}
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

      {/* Traffic Heat Map */}
      <TrafficHeatMap
        data={traffic.history.length > 0 ? aggregateTrafficByHour(traffic.history) : undefined}
        vessels={upcomingVessels.map((v) => ({
          hour: v.arrival_time ? parseInt(v.arrival_time.split(':')[0]) : 8,
          vesselName: v.vessel_name,
          estimatedTrucks: v.estimated_trucks,
        }))}
      />

      {/* Traffic Chart & Vessels Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Traffic Chart - 2 columns */}
        <div className="md:col-span-2">
          <TrafficChart
            data={traffic.history}
            title={t('chartTitle')}
            description={t('chartDescription')}
          />
        </div>

        {/* Upcoming Vessels Widget - 1 column */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {tDashboard('upcomingVessels')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVessels.length > 0 ? (
                  upcomingVessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className="border-l-4 border-blue-500 pl-3 py-1"
                    >
                      <div className="font-semibold text-sm">{vessel.vessel_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(vessel.arrival_date), "MMM d, yyyy")}
                        {vessel.arrival_time &&
                          ` ${tDashboard('at')} ${vessel.arrival_time.slice(0, 5)}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tDashboard('estimated')} {vessel.estimated_trucks}{" "}
                        {tCommon('trucks')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No upcoming vessels
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Updates Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('historicalTrends')}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timestamp')}</TableHead>
                <TableHead>{t('cameraId')}</TableHead>
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
