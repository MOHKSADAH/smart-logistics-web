import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid driver ID format" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Fetch driver by ID
    const { data: driver, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Return driver data
    return NextResponse.json(
      {
        success: true,
        driver: {
          id: driver.id,
          phone: driver.phone,
          name: driver.name,
          vehicle_plate: driver.vehicle_plate,
          vehicle_type: driver.vehicle_type,
          push_token: driver.push_token,
          is_active: driver.is_active,
          created_at: driver.created_at,
          updated_at: driver.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get driver API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// UPDATE driver (for admin dashboard)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid driver ID format" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Prepare update data (only allow certain fields)
    const allowedUpdates: any = {};
    if (body.name !== undefined) allowedUpdates.name = body.name;
    if (body.vehicle_plate !== undefined) allowedUpdates.vehicle_plate = body.vehicle_plate;
    if (body.vehicle_type !== undefined) allowedUpdates.vehicle_type = body.vehicle_type;
    if (body.is_active !== undefined) allowedUpdates.is_active = body.is_active;
    if (body.push_token !== undefined) allowedUpdates.push_token = body.push_token;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update driver
    const { data: updatedDriver, error } = await supabase
      .from("drivers")
      .update(allowedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedDriver) {
      console.error("Failed to update driver:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update driver" },
        { status: 500 }
      );
    }

    console.log(`[DRIVER UPDATED] ${updatedDriver.id} - ${updatedDriver.name}`);

    return NextResponse.json(
      {
        success: true,
        driver: {
          id: updatedDriver.id,
          phone: updatedDriver.phone,
          name: updatedDriver.name,
          vehicle_plate: updatedDriver.vehicle_plate,
          vehicle_type: updatedDriver.vehicle_type,
          is_active: updatedDriver.is_active,
          updated_at: updatedDriver.updated_at,
        },
        message: "Driver updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update driver API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
