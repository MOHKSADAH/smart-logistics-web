import { getServerSupabaseClient } from "@/lib/supabase";
import {
  TimeSlot,
  TrafficUpdate,
  VesselSchedule,
  PriorityRule,
} from "@/lib/types";

// Dashboard overview statistics
export async function getDashboardStats() {
  const supabase = getServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Get permits for today's slots
  const { data: todaySlots } = await supabase
    .from("time_slots")
    .select("id")
    .eq("date", today);

  const slotIds = todaySlots?.map((s) => s.id) || [];

  // Get permits for today
  const { data: permits } = await supabase
    .from("permits")
    .select("*")
    .in("slot_id", slotIds);

  const totalPermits = permits?.length || 0;
  const approvedCount =
    permits?.filter((p) => p.status === "APPROVED").length || 0;
  const haltedCount =
    permits?.filter((p) => p.status === "HALTED").length || 0;
  const protectedCount =
    permits?.filter((p) =>
      ["EMERGENCY", "ESSENTIAL"].includes(p.priority)
    ).length || 0;

  // Get latest traffic status
  const { data: latestTraffic } = await supabase
    .from("traffic_updates")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get today's slot utilization
  const { data: slots } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", today);

  const totalSlotsToday = slots?.length || 0;
  const fullSlotsToday =
    slots?.filter((s) => s.status === "FULL").length || 0;
  const availableSlotsToday = totalSlotsToday - fullSlotsToday;

  return {
    totalPermits,
    approvedCount,
    haltedCount,
    protectedCount,
    currentTrafficStatus: latestTraffic?.status || "NORMAL",
    vehicleCount: latestTraffic?.vehicle_count || 0,
    truckCount: latestTraffic?.truck_count || 0,
    totalSlotsToday,
    fullSlotsToday,
    availableSlotsToday,
  };
}

// Traffic data for charts and monitoring
export async function getTrafficData() {
  const supabase = getServerSupabaseClient();
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  // Latest traffic status
  const { data: current } = await supabase
    .from("traffic_updates")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 24-hour history for charts
  const { data: history } = await supabase
    .from("traffic_updates")
    .select("*")
    .gte("timestamp", twentyFourHoursAgo)
    .order("timestamp", { ascending: true });

  return {
    current: current as TrafficUpdate | null,
    history: (history as TrafficUpdate[]) || [],
  };
}

// Get all permits with enriched data (admin view)
export async function getAllPermits(filters?: {
  status?: string;
  priority?: string;
}) {
  const supabase = getServerSupabaseClient();

  let query = supabase
    .from("permits")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data: permits, error } = await query;

  if (error || !permits) {
    console.error("Failed to fetch permits:", error);
    return [];
  }

  // Get related data separately (batch queries)
  const driverIds = [...new Set(permits.map((p) => p.driver_id))];
  const slotIds = [...new Set(permits.map((p) => p.slot_id))];
  const vesselIds = [
    ...new Set(permits.filter((p) => p.vessel_id).map((p) => p.vessel_id!)),
  ];

  const [driversResult, slotsResult, vesselsResult] = await Promise.all([
    driverIds.length > 0
      ? supabase
          .from("drivers")
          .select("id, name, phone, vehicle_plate, vehicle_type")
          .in("id", driverIds)
      : Promise.resolve({ data: [] }),
    slotIds.length > 0
      ? supabase
          .from("time_slots")
          .select("id, date, start_time, end_time, capacity, booked, status, predicted_traffic")
          .in("id", slotIds)
      : Promise.resolve({ data: [] }),
    vesselIds.length > 0
      ? supabase
          .from("vessel_schedules")
          .select("id, vessel_name, arrival_date, arrival_time, estimated_trucks")
          .in("id", vesselIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Create lookup maps
  const driverMap: Record<string, { id: string; name: string; phone: string; vehicle_plate: string; vehicle_type: string }> =
    driversResult.data?.reduce(
      (acc, d) => ({ ...acc, [d.id]: d }),
      {}
    ) || {};
  const slotMap: Record<string, TimeSlot> =
    slotsResult.data?.reduce(
      (acc, s) => ({ ...acc, [s.id]: s }),
      {}
    ) || {};
  const vesselMap: Record<string, VesselSchedule> =
    vesselsResult.data?.reduce(
      (acc, v) => ({ ...acc, [v.id]: v }),
      {}
    ) || {};

  // Enrich permits with related data
  return permits.map((permit) => ({
    ...permit,
    driver: driverMap[permit.driver_id] || null,
    slot: slotMap[permit.slot_id] || null,
    vessel: permit.vessel_id ? vesselMap[permit.vessel_id] : null,
  }));
}

// Get slot utilization for a specific date
export async function getSlotUtilization(date: string) {
  const supabase = getServerSupabaseClient();

  const { data: slots } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", date)
    .order("start_time", { ascending: true });

  return (slots as TimeSlot[]) || [];
}

// Get upcoming vessel schedules
export async function getVesselSchedules() {
  const supabase = getServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: vessels } = await supabase
    .from("vessel_schedules")
    .select("*")
    .gte("arrival_date", today)
    .order("arrival_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  return (vessels as VesselSchedule[]) || [];
}

// Get priority rules for color coding
export async function getPriorityRules() {
  const supabase = getServerSupabaseClient();

  const { data: rules } = await supabase.from("priority_rules").select("*");

  return (rules as PriorityRule[]) || [];
}

// Analytics data
export async function getAnalyticsData() {
  const supabase = getServerSupabaseClient();
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Permits by date and priority (last 14 days)
  const { data: permits } = await supabase
    .from("permits")
    .select("created_at, priority, status")
    .gte("created_at", fourteenDaysAgo);

  // Group permits by date and priority
  const permitsByDate: Record<
    string,
    Record<string, number>
  > = {};
  permits?.forEach((p) => {
    const date = p.created_at.split("T")[0];
    if (!permitsByDate[date]) {
      permitsByDate[date] = {
        EMERGENCY: 0,
        ESSENTIAL: 0,
        NORMAL: 0,
        LOW: 0,
      };
    }
    permitsByDate[date][p.priority] = (permitsByDate[date][p.priority] || 0) + 1;
  });

  // Permits by status
  const permitsByStatus: Record<string, number> = {};
  permits?.forEach((p) => {
    permitsByStatus[p.status] = (permitsByStatus[p.status] || 0) + 1;
  });

  // Permits by priority
  const permitsByPriority: Record<string, number> = {};
  permits?.forEach((p) => {
    permitsByPriority[p.priority] = (permitsByPriority[p.priority] || 0) + 1;
  });

  // Traffic by hour of day (average vehicle count)
  const { data: trafficHistory } = await supabase
    .from("traffic_updates")
    .select("timestamp, vehicle_count")
    .gte("timestamp", fourteenDaysAgo);

  const trafficByHour: Record<number, { total: number; count: number }> = {};
  trafficHistory?.forEach((t) => {
    const hour = new Date(t.timestamp).getHours();
    if (!trafficByHour[hour]) {
      trafficByHour[hour] = { total: 0, count: 0 };
    }
    trafficByHour[hour].total += t.vehicle_count;
    trafficByHour[hour].count += 1;
  });

  const avgTrafficByHour = Object.entries(trafficByHour).map(
    ([hour, data]) => ({
      hour: parseInt(hour),
      avgVehicleCount: Math.round(data.total / data.count),
    })
  );

  return {
    permitsByDate,
    permitsByStatus,
    permitsByPriority,
    avgTrafficByHour,
  };
}
