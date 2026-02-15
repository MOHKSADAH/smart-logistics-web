import { FileCheck, XCircle, ShieldCheck, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { TrafficStatusBadge } from "@/components/traffic-status-badge";
import { RealtimeListener } from "@/components/realtime-listener";
import {
  getDashboardStats,
  getTrafficData,
  getVesselSchedules,
} from "@/lib/queries";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");

  const [stats, traffic, vessels] = await Promise.all([
    getDashboardStats(),
    getTrafficData(),
    getVesselSchedules(),
  ]);

  const recentTraffic = traffic.history.slice(-10).reverse();
  const upcomingVessels = vessels.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Real-time updates */}
      <RealtimeListener table="traffic_updates" />
      <RealtimeListener table="permits" />

      {/* Traffic Status Banner */}
      <Card
        data-tour="traffic-status"
        className={
          stats.currentTrafficStatus === "CONGESTED"
            ? "bg-red-50 border-red-200"
            : stats.currentTrafficStatus === "MODERATE"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t("trafficStatus")}</h2>
              <div className="flex items-center gap-4 mt-2">
                <TrafficStatusBadge status={stats.currentTrafficStatus} />
                <span className="text-sm text-muted-foreground">
                  {stats.vehicleCount} {tCommon("vehicles")} ·{" "}
                  {stats.truckCount} {tCommon("trucks")}
                </span>
                {traffic.current && (
                  <span className="text-xs text-muted-foreground">
                    {t("updated")}{" "}
                    {formatDistanceToNow(new Date(traffic.current.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalPermits")}
          value={stats.totalPermits}
          icon={FileCheck}
          description={t("activeBookings")}
        />
        <div data-tour="priority-protection">
          <StatCard
            title={t("approved")}
            value={stats.approvedCount}
            icon={ShieldCheck}
            description={t("protectedCount", { count: stats.protectedCount })}
            className="border-green-200"
          />
        </div>
        <StatCard
          title={t("halted")}
          value={stats.haltedCount}
          icon={XCircle}
          description={t("dueToCongestion")}
          className="border-red-200"
        />
        <StatCard
          title={t("slotUtilization")}
          value={`${stats.availableSlotsToday}/${stats.totalSlotsToday}`}
          icon={Calendar}
          description={t("availableSlots")}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Traffic Updates */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentTraffic")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("time")}</TableHead>
                    <TableHead>{t("camera")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead>{tCommon("vehicles")}</TableHead>
                    <TableHead>{tCommon("trucks")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTraffic.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell className="text-xs">
                        {format(new Date(update.timestamp), "HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {update.camera_id}
                      </TableCell>
                      <TableCell>
                        <TrafficStatusBadge status={update.status} />
                      </TableCell>
                      <TableCell>{update.vehicle_count}</TableCell>
                      <TableCell>{update.truck_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Vessels */}
        <div data-tour="vessel-widget">
          <Card>
            <CardHeader>
              <CardTitle>{t("upcomingVessels")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVessels.map((vessel) => (
                  <div
                    key={vessel.id}
                    className="border-l-4 border-blue-500 pl-3"
                  >
                    <div className="font-semibold">{vessel.vessel_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(vessel.arrival_date), "MMM d, yyyy")}
                      {vessel.arrival_time &&
                        ` ${t("at")} ${vessel.arrival_time.slice(0, 5)}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("estimated")} {vessel.estimated_trucks}{" "}
                      {tCommon("trucks")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
