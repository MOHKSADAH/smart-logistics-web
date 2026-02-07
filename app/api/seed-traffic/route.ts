import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  const supabase = getServerSupabaseClient();

  // Generate traffic data for the last 48 hours (every 30 minutes)
  const trafficData = [];
  const now = new Date();

  for (let i = 0; i < 96; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 min intervals
    const hour = timestamp.getHours();

    // Simulate realistic traffic patterns
    let vehicleCount: number;
    let status: "NORMAL" | "MODERATE" | "CONGESTED";

    // Peak hours: 7-9 AM and 4-6 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      vehicleCount = Math.floor(Math.random() * 50) + 120; // 120-170
      status = vehicleCount > 150 ? "CONGESTED" : "MODERATE";
    }
    // Normal hours
    else if (hour >= 6 && hour <= 20) {
      vehicleCount = Math.floor(Math.random() * 60) + 60; // 60-120
      status = vehicleCount > 100 ? "MODERATE" : "NORMAL";
    }
    // Night hours
    else {
      vehicleCount = Math.floor(Math.random() * 40) + 20; // 20-60
      status = "NORMAL";
    }

    const truckCount = Math.floor(vehicleCount * 0.15); // 15% trucks

    trafficData.push({
      camera_id: "CAM_01_KING_ABDULAZIZ",
      timestamp: timestamp.toISOString(),
      status,
      vehicle_count: vehicleCount,
      truck_count: truckCount,
      recommendation: status === "CONGESTED" ? "HALT_TRUCK_PERMITS" : null,
    });
  }

  // Delete old data and insert fresh data
  await supabase.from("traffic_updates").delete().gte("id", 0);

  const { error } = await supabase
    .from("traffic_updates")
    .insert(trafficData);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${trafficData.length} traffic records`,
    latest: trafficData[0],
  });
}
