import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, AlertTriangle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServerSupabaseClient } from "@/lib/supabase";

export default async function OrgVesselsPage() {
  const supabase = getServerSupabaseClient();

  // Get upcoming vessels for next 7 days
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: vessels } = await supabase
    .from("vessel_schedules")
    .select("*")
    .gte("arrival_date", today)
    .lte("arrival_date", sevenDaysLater)
    .order("arrival_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  const upcomingVessels = vessels || [];

  // Calculate congestion level based on estimated trucks
  const getCongestionLevel = (estimatedTrucks: number) => {
    if (estimatedTrucks > 400) return { level: "HIGH", color: "text-red-500 bg-red-50 border-red-200" };
    if (estimatedTrucks > 200) return { level: "MODERATE", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    return { level: "LOW", color: "text-green-600 bg-green-50 border-green-200" };
  };

  // Get recommended time slots
  const getRecommendedSlots = (estimatedTrucks: number) => {
    if (estimatedTrucks > 400) {
      return ["Night Shift: 10pm-6am (LOW priority)", "Early Morning: 6am-9am (NORMAL)"];
    }
    if (estimatedTrucks > 200) {
      return ["Off-Peak: 2pm-6pm (NORMAL)", "Evening: 6pm-10pm"];
    }
    return ["Standard slots available"];
  };

  // Group vessels by date
  const vesselsByDate = upcomingVessels.reduce((acc, vessel) => {
    const date = vessel.arrival_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(vessel);
    return acc;
  }, {} as Record<string, typeof upcomingVessels>);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Vessel Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Upcoming vessel arrivals with truck surge predictions and recommended time slots
        </p>
      </div>

      {/* Warning Banner */}
      {upcomingVessels.some(v => v.estimated_trucks > 400) && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  High Congestion Expected
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {upcomingVessels.filter(v => v.estimated_trucks > 400).length} vessel(s) arriving with 400+ trucks.
                  Consider booking night shift or off-peak slots for LOW/NORMAL priority cargo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vessel Schedule Table */}
      {Object.entries(vesselsByDate).length > 0 ? (
        Object.entries(vesselsByDate).map(([date, dateVessels]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
                <span className="text-sm font-normal text-muted-foreground">
                  ({dateVessels.length} vessel{dateVessels.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vessel Name</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead className="text-right">Estimated Trucks</TableHead>
                    <TableHead>Congestion Level</TableHead>
                    <TableHead>Recommended Slots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dateVessels.map((vessel) => {
                    const congestion = getCongestionLevel(vessel.estimated_trucks);
                    const recommendations = getRecommendedSlots(vessel.estimated_trucks);

                    return (
                      <TableRow key={vessel.id}>
                        <TableCell className="font-medium">
                          {vessel.vessel_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {vessel.arrival_time ? vessel.arrival_time.slice(0, 5) : "TBD"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={vessel.estimated_trucks > 100 ? "font-semibold text-red-600" : ""}>
                            {vessel.estimated_trucks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${congestion.color}`}>
                            {congestion.level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {recommendations.map((rec, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Daily Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total estimated trucks for {format(new Date(date), "MMM d")}:
                  </span>
                  <span className="font-semibold">
                    {dateVessels.reduce((sum, v) => sum + v.estimated_trucks, 0)} trucks
                  </span>
                </div>
                {dateVessels.reduce((sum, v) => sum + v.estimated_trucks, 0) > 500 && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Expect heavy congestion 10am-2pm (containers ready 2-4h after vessel arrival)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vessels scheduled for the next 7 days</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Vessel Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Why vessel schedules matter:</strong> When a vessel arrives at Dammam Port (typically 7-9 AM),
            containers become available 2-4 hours later. This creates a predictable truck surge around 10am-2pm.
          </p>
          <p>
            <strong>PORTA's solution:</strong> By predicting vessel arrivals, we can spread truck movements across 24 hours.
            EMERGENCY cargo gets protected peak slots. NORMAL cargo is rescheduled to off-peak. LOW priority moves to night shifts.
          </p>
          <p>
            <strong>Result:</strong> 65% reduction in peak congestion (from 171 trucks/hour to 60 trucks/hour) while
            maintaining 100% on-time delivery for urgent cargo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
