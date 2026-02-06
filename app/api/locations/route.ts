import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

// Zod schema for location update
const LocationSchema = z.object({
  driver_id: z.string().uuid("Invalid driver ID"),
  permit_id: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().int().min(0).max(360).optional(),
  eta_minutes: z.number().int().optional(),
  recorded_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LocationSchema.parse(body);

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Verify driver exists
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, name")
      .eq("id", validatedData.driver_id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 }
      );
    }

    // If permit_id provided, verify it exists and belongs to driver
    if (validatedData.permit_id) {
      const { data: permit, error: permitError } = await supabase
        .from("permits")
        .select("id, driver_id, status")
        .eq("id", validatedData.permit_id)
        .eq("driver_id", validatedData.driver_id)
        .single();

      if (permitError || !permit) {
        return NextResponse.json(
          { success: false, message: "Permit not found or does not belong to driver" },
          { status: 404 }
        );
      }
    }

    // Insert location update
    const { data: location, error: locationError } = await supabase
      .from("driver_locations")
      .insert({
        driver_id: validatedData.driver_id,
        permit_id: validatedData.permit_id || null,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        accuracy: validatedData.accuracy || null,
        speed: validatedData.speed || null,
        heading: validatedData.heading || null,
        eta_minutes: validatedData.eta_minutes || null,
        recorded_at: validatedData.recorded_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (locationError) {
      console.error("Failed to record location:", locationError);
      return NextResponse.json(
        { success: false, message: "Failed to record location" },
        { status: 500 }
      );
    }

    console.log(`[LOCATION UPDATE] Driver: ${driver.name}`, {
      lat: validatedData.latitude,
      lng: validatedData.longitude,
      speed: validatedData.speed,
      eta: validatedData.eta_minutes,
    });

    return NextResponse.json(
      {
        success: true,
        location: {
          id: location.id,
          driver_id: location.driver_id,
          permit_id: location.permit_id,
          latitude: location.latitude,
          longitude: location.longitude,
          recorded_at: location.recorded_at,
        },
        message: "Location recorded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    console.error("Locations API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch driver locations (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverIdParam = searchParams.get("driver_id");
    const limitParam = searchParams.get("limit") || "50";

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    let query = supabase
      .from("driver_locations")
      .select(
        `
        *,
        driver:drivers(id, name, phone, vehicle_plate),
        permit:permits(id, qr_code, status, priority)
      `
      )
      .order("recorded_at", { ascending: false })
      .limit(parseInt(limitParam));

    // Filter by driver if provided
    if (driverIdParam) {
      query = query.eq("driver_id", driverIdParam);
    }

    const { data: locations, error } = await query;

    if (error) {
      console.error("Failed to fetch locations:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch locations" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        locations,
        count: locations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Locations GET API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
