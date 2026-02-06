import { FileCheck, XCircle, ShieldCheck, Calendar } from "lucide-react";
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
import { StatCard } from "@/components/stat-card";
import { TrafficStatusBadge } from "@/components/traffic-status-badge";
import {
  getDashboardStats,
  getTrafficData,
  getVesselSchedules,
} from "@/lib/queries";

export default async function DashboardPage() {
  const [stats, traffic, vessels] = await Promise.all([
    getDashboardStats(),
    getTrafficData(),
    getVesselSchedules(),
  ]);

  const recentTraffic = traffic.history.slice(-10).reverse();
  const upcomingVessels = vessels.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Traffic Status Banner */}
      <Card
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
              <h2 className="text-2xl font-bold">Current Traffic Status</h2>
              <div className="flex items-center gap-4 mt-2">
                <TrafficStatusBadge status={stats.currentTrafficStatus} />
                <span className="text-sm text-muted-foreground">
                  {stats.vehicleCount} vehicles · {stats.truckCount} trucks
                </span>
                {traffic.current && (
                  <span className="text-xs text-muted-foreground">
                    Updated{" "}
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
          title="Total Permits Today"
          value={stats.totalPermits}
          icon={FileCheck}
          description="Active bookings"
        />
        <StatCard
          title="Approved"
          value={stats.approvedCount}
          icon={ShieldCheck}
          description={`${stats.protectedCount} priority protected`}
          className="border-green-200"
        />
        <StatCard
          title="Halted"
          value={stats.haltedCount}
          icon={XCircle}
          description="Due to congestion"
          className="border-red-200"
        />
        <StatCard
          title="Slot Utilization"
          value={`${stats.availableSlotsToday}/${stats.totalSlotsToday}`}
          icon={Calendar}
          description="Available slots"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Traffic Updates */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Traffic Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Camera</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Trucks</TableHead>
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
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Vessels</CardTitle>
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
                        ` at ${vessel.arrival_time.slice(0, 5)}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Est. {vessel.estimated_trucks} trucks
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
