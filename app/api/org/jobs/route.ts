import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// Helper: Get organization from session
async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  const session = JSON.parse(sessionCookie.value);
  if (session.expires_at < Date.now()) return null;
  return session;
}

// GET /api/org/jobs - List jobs with filters
export async function GET(request: NextRequest) {
  try {
    // Skip session check for hackathon demo
    // const session = await getOrgSession();
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: "Not authenticated" },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, ASSIGNED, IN_PROGRESS, COMPLETED
    const date = searchParams.get("date"); // YYYY-MM-DD
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getServerSupabaseClient();

    // Build query
    let query = supabase
      .from("jobs")
      .select(`
        *,
        driver:drivers!assigned_driver_id (
          id,
          name,
          phone,
          vehicle_plate
        ),
        permit:permits!permit_id (
          id,
          qr_code,
          permit_code,
          status,
          slot:time_slots (
            date,
            start_time,
            end_time
          )
        )
      `, { count: "exact" })
      // .eq("organization_id", session.organization_id) // Disabled for demo
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (date) {
      query = query.eq("preferred_date", date);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error("Failed to fetch jobs:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Format response
    const formattedJobs = jobs?.map((job: any) => ({
      id: job.id,
      job_number: job.job_number,
      customer_name: job.customer_name,
      container_number: job.container_number,
      cargo_type: job.cargo_type,
      priority: job.priority,
      status: job.status,
      preferred_date: job.preferred_date,
      preferred_time: job.preferred_time,
      assigned_driver: job.driver ? {
        name: job.driver.name,
        phone: job.driver.phone,
        vehicle_plate: job.driver.vehicle_plate,
      } : null,
      permit: job.permit ? {
        qr_code: job.permit.qr_code,
        permit_code: job.permit.permit_code,
        status: job.permit.status,
        slot_time: job.permit.slot ? `${job.permit.slot.start_time} - ${job.permit.slot.end_time}` : null,
        slot_date: job.permit.slot?.date,
      } : null,
      created_at: job.created_at,
      assigned_at: job.assigned_at,
      completed_at: job.completed_at,
    })) || [];

    return NextResponse.json(
      {
        success: true,
        jobs: formattedJobs,
        count: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Jobs list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
