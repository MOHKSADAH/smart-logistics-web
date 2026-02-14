import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  try {
    const supabase = getServerSupabaseClient();

    // Create vessel arriving tomorrow at 8:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const arrivalDate = tomorrow.toISOString().split('T')[0];

    const vesselData = {
      vessel_name: `DEMO MAERSK ${Math.floor(Math.random() * 1000)}`,
      arrival_date: arrivalDate,
      arrival_time: "08:00:00",
      estimated_trucks: 560,
      cargo_priority: "NORMAL",
      status: "SCHEDULED",
    };

    const { data: vessel, error } = await supabase
      .from("vessel_schedules")
      .insert(vesselData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create demo vessel:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create vessel", error: error.message },
        { status: 500 }
      );
    }

    // Update time slot capacities for predicted surge (10am-2pm window)
    const surgeDate = arrivalDate; // Same day as arrival
    const surgeSlots = ["10:00:00", "12:00:00", "14:00:00"];

    // Get slots for surge period
    const { data: slots } = await supabase
      .from("time_slots")
      .select("id, start_time")
      .eq("date", surgeDate)
      .in("start_time", surgeSlots);

    let slotsUpdated = 0;
    if (slots && slots.length > 0) {
      // Reduce capacity to simulate congestion
      const { error: updateError } = await supabase
        .from("time_slots")
        .update({ capacity: 5 }) // Reduced from default 10
        .in("id", slots.map(s => s.id));

      if (!updateError) {
        slotsUpdated = slots.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created demo vessel arriving ${arrivalDate} at 08:00`,
      data: {
        vessel_name: vessel.vessel_name,
        arrival_date: vessel.arrival_date,
        arrival_time: vessel.arrival_time,
        estimated_trucks: vessel.estimated_trucks,
        surge_warning: "560 trucks expected 10am-2pm (containers ready 2-4h after arrival)",
        slots_adjusted: slotsUpdated,
      },
    });
  } catch (error) {
    console.error("Demo create-vessel error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
