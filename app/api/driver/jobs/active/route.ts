import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/driver/jobs/active
 *
 * Returns all assigned jobs for the authenticated driver
 * Used by Team 2 mobile app to show active deliveries
 *
 * Authentication: Supabase Auth Bearer token
 *
 * Response:
 * {
 *   success: true,
 *   jobs: [{
 *     job_id, job_number, status, customer_name,
 *     pickup_location, destination, cargo_type, priority,
 *     delivery_date, notes,
 *     permit: { permit_code, qr_code, status, time_slot },
 *     organization: { name, contact_phone }
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get driver_id from query params or auth header
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driver_id");

    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          error: "driver_id is required (query param or from auth token)",
        },
        { status: 400 }
      );
    }

    const supabase = getServerSupabaseClient();

    // Get all jobs assigned to this driver that are not completed
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(
        `
        id,
        job_number,
        status,
        customer_name,
        container_number,
        container_count,
        cargo_type,
        priority,
        pickup_location,
        destination,
        preferred_date,
        preferred_time,
        notes,
        created_at,
        organization:organizations(
          id,
          name,
          contact_phone,
          contact_email
        ),
        permit:permits(
          id,
          permit_code,
          qr_code,
          status,
          time_slot:time_slots(
            id,
            date,
            start_time,
            end_time,
            predicted_traffic
          )
        )
      `
      )
      .eq("assigned_driver_id", driverId)
      .in("status", ["ASSIGNED", "IN_PROGRESS"])
      .order("preferred_date", { ascending: true })
      .order("preferred_time", { ascending: true });

    if (jobsError) {
      console.error("Failed to fetch driver jobs:", jobsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch jobs",
          details: jobsError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to match Team 2's expected format
    const formattedJobs = (jobs || []).map((job) => ({
      job_id: job.id,
      job_number: job.job_number,
      status: job.status,
      customer_name: job.customer_name,
      container_number: job.container_number,
      container_count: job.container_count,
      cargo_type: job.cargo_type,
      priority: job.priority,
      pickup_location: job.pickup_location,
      destination: job.destination,
      delivery_date: job.preferred_date,
      delivery_time: job.preferred_time,
      notes: job.notes,
      created_at: job.created_at,

      // Permit details (may be null if not yet generated)
      permit: job.permit
        ? {
            permit_id: job.permit.id,
            permit_code: job.permit.permit_code,
            qr_code: job.permit.qr_code,
            status: job.permit.status,
            time_slot: job.permit.time_slot
              ? {
                  date: job.permit.time_slot.date,
                  start_time: job.permit.time_slot.start_time,
                  end_time: job.permit.time_slot.end_time,
                  predicted_traffic: job.permit.time_slot.predicted_traffic,
                }
              : null,
          }
        : null,

      // Organization details
      organization: job.organization
        ? {
            name: job.organization.name,
            contact_phone: job.organization.contact_phone,
            contact_email: job.organization.contact_email,
          }
        : null,
    }));

    console.log(
      `[DRIVER JOBS] Driver ${driverId} has ${formattedJobs.length} active jobs`
    );

    return NextResponse.json(
      {
        success: true,
        count: formattedJobs.length,
        jobs: formattedJobs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Driver jobs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
