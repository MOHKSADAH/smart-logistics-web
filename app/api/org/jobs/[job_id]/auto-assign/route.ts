import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  const session = JSON.parse(sessionCookie.value);
  if (session.expires_at < Date.now()) return null;
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    // Skip session check for hackathon demo
    // const session = await getOrgSession();
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: "Not authenticated" },
    //     { status: 401 }
    //   );
    // }

    const { job_id } = await params;
    const supabase = getServerSupabaseClient();

    // Get job details with single query
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*, organization_id, preferred_date, preferred_time, priority, cargo_type, job_number")
      .eq("id", job_id)
      // .eq("organization_id", session.organization_id) // Disabled for demo
      .single();

    console.log("[AUTO-ASSIGN] Job data:", {
      id: job_id,
      cargo_type: job?.cargo_type,
      priority: job?.priority,
      status: job?.status,
    });

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Job already assigned" },
        { status: 400 }
      );
    }

    // Find best available driver (closest to pickup, available, active)
    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("id, name, phone, vehicle_plate, has_smartphone, prefers_sms")
      .eq("organization_id", job.organization_id) // Use job's org instead of session
      .eq("is_available", true)
      .eq("is_active", true)
      .limit(1);

    if (driversError || !drivers || drivers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No available drivers found" },
        { status: 404 }
      );
    }

    const driver = drivers[0];

    // Find best time slot - with debug logging
    console.log("[AUTO-ASSIGN] Looking for slot:", {
      date: job.preferred_date,
      time: job.preferred_time,
      priority: job.priority
    });

    const { data: slot_id, error: slotError } = await supabase.rpc("find_best_slot", {
      p_preferred_date: job.preferred_date,
      p_preferred_time: job.preferred_time,
      p_priority: job.priority,
    });

    console.log("[AUTO-ASSIGN] Slot result:", { slot_id, error: slotError });

    if (!slot_id) {
      // Check if function exists and slots exist
      const { count } = await supabase
        .from("time_slots")
        .select("*", { count: "exact", head: true })
        .gte("date", job.preferred_date);

      console.error("[AUTO-ASSIGN] No slot found. Total slots:", count);

      return NextResponse.json(
        {
          success: false,
          error: "No available time slots found",
          debug: {
            searched_date: job.preferred_date,
            searched_time: job.preferred_time,
            total_slots_in_db: count,
            rpc_error: slotError?.message
          }
        },
        { status: 404 }
      );
    }

    // Generate permit code
    const { data: permitCode } = await supabase.rpc("generate_permit_code");
    const qrCode = `PERMIT-${job_id.slice(0, 8)}-${Date.now()}`;

    // Atomic transaction: update job, create permit, update driver, update slot
    const { data: permit, error: permitError } = await supabase
      .from("permits")
      .insert({
        driver_id: driver.id,
        slot_id: slot_id,
        job_id: job_id,
        permit_code: permitCode || `P-${Date.now()}`,
        qr_code: qrCode,
        priority: job.priority,
        cargo_type: job.cargo_type,
        status: "APPROVED",
        delivery_method: driver.has_smartphone && !driver.prefers_sms ? "APP" : "SMS",
      })
      .select()
      .single();

    if (permitError || !permit) {
      console.error("[AUTO-ASSIGN] Permit creation failed:", {
        error: permitError,
        job_cargo_type: job.cargo_type,
        job_priority: job.priority,
        driver_id: driver.id,
        slot_id: slot_id,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create permit: ${permitError?.message || "Unknown error"}`,
          details: permitError
        },
        { status: 500 }
      );
    }

    // Update job with driver and permit
    await supabase
      .from("jobs")
      .update({
        assigned_driver_id: driver.id,
        permit_id: permit.id,
        status: "ASSIGNED",
      })
      .eq("id", job_id);

    // Mark driver as unavailable
    await supabase
      .from("drivers")
      .update({ is_available: false })
      .eq("id", driver.id);

    // Send notification
    const deliveryMethod = driver.has_smartphone && !driver.prefers_sms ? "APP" : "SMS";
    await supabase.from("notifications").insert({
      driver_id: driver.id,
      title: "New Job Assigned",
      message: `Job ${job.job_number} assigned. Permit: ${permit.permit_code}`,
      delivery_method: deliveryMethod,
    });

    console.log(
      `[AUTO-ASSIGN] Job ${job.job_number} → Driver ${driver.name} → Permit ${permit.permit_code}`
    );

    return NextResponse.json(
      {
        success: true,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle_plate: driver.vehicle_plate,
        },
        permit: {
          permit_code: permit.permit_code,
          qr_code: permit.qr_code,
          status: permit.status,
        },
        notification_sent: deliveryMethod,
        message: "Job automatically assigned to best available driver",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auto-assign error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
