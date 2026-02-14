import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  try {
    const supabase = getServerSupabaseClient();

    const results = {
      jobs_deleted: 0,
      permits_deleted: 0,
      vessels_deleted: 0,
      drivers_reset: 0,
      traffic_deleted: 0,
    };

    // Delete demo jobs (jobs with "Demo job" in notes)
    const { data: deletedJobs, error: jobsError } = await supabase
      .from("jobs")
      .delete()
      .ilike("notes", "%Demo job%")
      .select();
    if (jobsError) throw jobsError;
    results.jobs_deleted = deletedJobs?.length || 0;

    // Delete demo permits (permits created in last 24 hours with no driver assigned)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: deletedPermits, error: permitsError } = await supabase
      .from("permits")
      .delete()
      .gte("created_at", yesterday)
      .is("driver_id", null)
      .select();
    if (permitsError) throw permitsError;
    results.permits_deleted = deletedPermits?.length || 0;

    // Delete demo vessels (vessels with "DEMO" in name)
    const { data: deletedVessels, error: vesselsError } = await supabase
      .from("vessel_schedules")
      .delete()
      .ilike("vessel_name", "%DEMO%")
      .select();
    if (vesselsError) throw vesselsError;
    results.vessels_deleted = deletedVessels?.length || 0;

    // Reset all drivers to available
    const { data: updatedDrivers, error: driversError } = await supabase
      .from("drivers")
      .update({ is_available: true })
      .eq("is_active", true)
      .select();
    if (driversError) throw driversError;
    results.drivers_reset = updatedDrivers?.length || 0;

    // Clear traffic data older than 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: deletedTraffic, error: trafficError } = await supabase
      .from("traffic_updates")
      .delete()
      .lt("timestamp", twoDaysAgo)
      .select();
    if (trafficError) throw trafficError;
    results.traffic_deleted = deletedTraffic?.length || 0;

    // Reset time slot capacities to default (for past dates)
    const today = new Date().toISOString().split('T')[0];
    const { error: slotsError } = await supabase
      .from("time_slots")
      .update({ capacity: 10, booked: 0 })
      .lt("date", today);
    if (slotsError) throw slotsError;

    return NextResponse.json({
      success: true,
      message: "Demo data reset successfully",
      data: results,
    });
  } catch (error) {
    console.error("Demo reset error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
