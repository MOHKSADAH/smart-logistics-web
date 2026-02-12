import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// Helper: Get organization from session
async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");

  if (!sessionCookie) {
    return null;
  }

  const session = JSON.parse(sessionCookie.value);

  if (session.expires_at < Date.now()) {
    return null;
  }

  return session;
}

// GET /api/org/drivers - List company's drivers
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = getServerSupabaseClient();

    // Fetch drivers for this organization with current job info
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select(`
        id,
        name,
        phone,
        vehicle_plate,
        vehicle_type,
        employee_id,
        is_available,
        has_smartphone,
        prefers_sms,
        is_active,
        created_at,
        jobs:jobs!assigned_driver_id (
          id,
          job_number,
          status,
          customer_name
        )
      `)
      .eq("organization_id", session.organization_id)
      .order("name");

    if (error) {
      console.error("Failed to fetch drivers:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    // Format response with current job
    const formattedDrivers = drivers.map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicle_plate: driver.vehicle_plate,
      vehicle_type: driver.vehicle_type,
      employee_id: driver.employee_id,
      is_available: driver.is_available,
      has_smartphone: driver.has_smartphone,
      prefers_sms: driver.prefers_sms,
      is_active: driver.is_active,
      current_job: driver.jobs?.find((j: any) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS") || null,
    }));

    return NextResponse.json(
      {
        success: true,
        drivers: formattedDrivers,
        count: formattedDrivers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get drivers API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
