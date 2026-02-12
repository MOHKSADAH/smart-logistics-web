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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> },
) {
  try {
    // Check authentication
    const session = await getOrgSession();
    if (!session) {
      console.log("[Track Route] No session found");
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { job_id } = await params;
    console.log(
      "[Track Route] Fetching job:",
      job_id,
      "for org:",
      session.organization_id,
    );
    const supabase = getServerSupabaseClient();

    // Fetch job with all related data
    const { data: job, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        driver:drivers!assigned_driver_id (
          id,
          name,
          phone,
          vehicle_plate,
          vehicle_type
        ),
        permit:permits!permit_id (
          id,
          qr_code,
          permit_code,
          status,
          priority,
          approved_at,
          halted_at,
          slot:time_slots!permits_slot_id_fkey (
            id,
            date,
            start_time,
            end_time,
            capacity,
            booked,
            predicted_traffic
          )
        )
      `,
      )
      .eq("id", job_id)
      .eq("organization_id", session.organization_id)
      .single();

    if (error || !job) {
      console.log("[Track Route] Job not found:", {
        error,
        job_id,
        error_message: error?.message,
      });
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    console.log("[Track Route] Job found:", job.job_number);

    // Get driver's latest location if assigned
    let currentLocation = null;
    if (job.assigned_driver_id) {
      const { data: location } = await supabase
        .from("driver_locations")
        .select("*")
        .eq("driver_id", job.assigned_driver_id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (location) {
        currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          recorded_at: location.recorded_at,
          speed: location.speed,
          eta_minutes: location.eta_minutes,
        };
      }
    }

    // Build timeline
    const timeline = [
      {
        event: "Job Created",
        timestamp: job.created_at,
        status: "completed",
      },
    ];

    if (job.assigned_at) {
      timeline.push({
        event: job.driver
          ? `Driver Assigned: ${job.driver.name}`
          : "Driver Assigned",
        timestamp: job.assigned_at,
        status: "completed",
      });
    }

    if (job.status === "IN_PROGRESS") {
      timeline.push({
        event: "In Progress",
        timestamp: new Date().toISOString(),
        status: "current",
      });
    }

    if (job.completed_at) {
      timeline.push({
        event: "Completed",
        timestamp: job.completed_at,
        status: "completed",
      });
    }

    // Format response
    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          job_number: job.job_number,
          customer_name: job.customer_name,
          container_number: job.container_number,
          container_count: job.container_count,
          cargo_type: job.cargo_type,
          priority: job.priority,
          pickup_location: job.pickup_location,
          destination: job.destination,
          status: job.status,
          notes: job.notes,
          created_at: job.created_at,
          assigned_at: job.assigned_at,
          completed_at: job.completed_at,
          preferred_date: job.preferred_date,
          preferred_time: job.preferred_time,
          updated_at: job.updated_at,
        },
        driver: job.driver
          ? {
              id: job.driver.id,
              name: job.driver.name,
              phone: job.driver.phone,
              vehicle_plate: job.driver.vehicle_plate,
              vehicle_type: job.driver.vehicle_type,
              current_location: currentLocation,
            }
          : null,
        permit: job.permit
          ? {
              id: job.permit.id,
              qr_code: job.permit.qr_code,
              permit_code: job.permit.permit_code,
              status: job.permit.status,
              priority: job.permit.priority,
              slot: job.permit.slot
                ? {
                    date: job.permit.slot.date,
                    start_time: job.permit.slot.start_time,
                    end_time: job.permit.slot.end_time,
                    predicted_traffic: job.permit.slot.predicted_traffic,
                  }
                : null,
            }
          : null,
        timeline,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Track Route] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
