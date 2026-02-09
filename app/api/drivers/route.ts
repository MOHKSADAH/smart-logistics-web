import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

// GET all drivers (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // "active", "inactive", "all"
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Build query
    let query = supabase
      .from("drivers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by active status
    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    // Search filter (phone, name, or vehicle plate)
    if (search) {
      query = query.or(
        `phone.ilike.%${search}%,name.ilike.%${search}%,vehicle_plate.ilike.%${search}%`
      );
    }

    const { data: drivers, error, count } = await query;

    if (error) {
      console.error("Failed to fetch drivers:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        drivers: drivers || [],
        count: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Drivers API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
