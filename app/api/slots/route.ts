import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

// Zod schema for query parameters
const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter: date" },
        { status: 400 }
      );
    }

    // Validate date format
    const validatedParams = SlotsQuerySchema.parse({ date: dateParam });

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Fetch time slots for the specified date
    const { data: slots, error } = await supabase
      .from("time_slots")
      .select("*")
      .eq("date", validatedParams.date)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch time slots:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch time slots" },
        { status: 500 }
      );
    }

    // Fetch vessel schedules for the same date (to show truck surge predictions)
    const { data: vessels } = await supabase
      .from("vessel_schedules")
      .select("*")
      .eq("arrival_date", validatedParams.date)
      .order("arrival_time", { ascending: true });

    // Fetch latest traffic status
    const { data: latestTraffic } = await supabase
      .from("traffic_updates")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    // Enrich slots with availability status
    const enrichedSlots = slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      capacity: slot.capacity,
      booked: slot.booked,
      available: slot.capacity - slot.booked,
      status: slot.status,
      predicted_traffic: slot.predicted_traffic,
      is_available: slot.status === "AVAILABLE" && slot.booked < slot.capacity,
    }));

    return NextResponse.json(
      {
        success: true,
        date: validatedParams.date,
        slots: enrichedSlots,
        vessels: vessels || [],
        current_traffic: latestTraffic
          ? {
              status: latestTraffic.status,
              vehicle_count: latestTraffic.vehicle_count,
              truck_count: latestTraffic.truck_count,
              timestamp: latestTraffic.timestamp,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    console.error("Slots API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
