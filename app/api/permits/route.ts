import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";
import type { Driver, TimeSlot, VesselSchedule } from "@/lib/types";

// Zod schema for query parameters
const PermitsQuerySchema = z.object({
  driver_id: z.string().uuid("Invalid driver ID"),
  status: z
    .enum([
      "PENDING",
      "APPROVED",
      "HALTED",
      "CANCELLED",
      "EXPIRED",
      "COMPLETED",
    ])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const driverIdParam = searchParams.get("driver_id");
    const statusParam = searchParams.get("status");

    if (!driverIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter: driver_id" },
        { status: 400 },
      );
    }

    // Validate parameters
    const validatedParams = PermitsQuerySchema.parse({
      driver_id: driverIdParam,
      status: statusParam || undefined,
    });

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Fetch permits for the driver
    let query = supabase
      .from("permits")
      .select("*")
      .eq("driver_id", validatedParams.driver_id)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (validatedParams.status) {
      query = query.eq("status", validatedParams.status);
    }

    const { data: permits, error } = await query;

    if (error) {
      console.error("Failed to fetch permits:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch permits" },
        { status: 500 },
      );
    }

    const safePermits = permits || [];

    if (safePermits.length === 0) {
      const { data: priorityRules, error: priorityRulesError } = await supabase
        .from("priority_rules")
        .select("cargo_type, priority_level, color_code, description");

      if (priorityRulesError) {
        console.error("Failed to fetch priority rules:", priorityRulesError);
      }

      return NextResponse.json(
        {
          success: true,
          permits: [],
          priority_rules: priorityRules || [],
          count: 0,
        },
        { status: 200 },
      );
    }

    // Get related data separately
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, name, phone, vehicle_plate, vehicle_type")
      .in(
        "id",
        safePermits.map((p) => p.driver_id),
      );

    const { data: slots } = await supabase
      .from("time_slots")
      .select(
        "id, date, start_time, end_time, capacity, booked, status, predicted_traffic",
      )
      .in(
        "id",
        safePermits.map((p) => p.slot_id),
      );

    const { data: vessels } = await supabase
      .from("vessel_schedules")
      .select("id, vessel_name, arrival_date, arrival_time, estimated_trucks")
      .in(
        "id",
        safePermits.filter((p) => p.vessel_id).map((p) => p.vessel_id),
      );

    // Create maps for quick lookup
    const driverMap: Record<string, Driver> =
      drivers?.reduce(
        (acc, d) => ({ ...acc, [d.id]: d }),
        {} as Record<string, Driver>,
      ) || {};
    const slotMap: Record<string, TimeSlot> =
      slots?.reduce(
        (acc, s) => ({ ...acc, [s.id]: s }),
        {} as Record<string, TimeSlot>,
      ) || {};
    const vesselMap: Record<string, VesselSchedule> =
      vessels?.reduce(
        (acc, v) => ({ ...acc, [v.id]: v }),
        {} as Record<string, VesselSchedule>,
      ) || {};

    // Enrich permits with related data
    const enrichedPermits = safePermits.map((permit) => ({
      id: permit.id,
      qr_code: permit.qr_code,
      status: permit.status,
      priority: permit.priority,
      cargo_type: permit.cargo_type,
      created_at: permit.created_at,
      approved_at: permit.approved_at,
      halted_at: permit.halted_at,
      expires_at: permit.expires_at,
      entry_time: permit.entry_time,
      exit_time: permit.exit_time,
      completed_at: permit.completed_at,
      notes: permit.notes,
      rescheduled_count: permit.rescheduled_count,
      suggested_slots: permit.suggested_slots,
      driver: driverMap[permit.driver_id] || null,
      slot: slotMap[permit.slot_id] || null,
      vessel: permit.vessel_id ? vesselMap[permit.vessel_id] : null,
    }));

    // Get priority rule color codes for UI
    const { data: priorityRules, error: priorityRulesError } = await supabase
      .from("priority_rules")
      .select("cargo_type, priority_level, color_code, description");

    if (priorityRulesError) {
      console.error("Failed to fetch priority rules:", priorityRulesError);
    }

    return NextResponse.json(
      {
        success: true,
        permits: enrichedPermits,
        priority_rules: priorityRules || [],
        count: enrichedPermits.length,
      },
      { status: 200 },
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid parameters",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    // Handle generic errors
    console.error("Permits API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
