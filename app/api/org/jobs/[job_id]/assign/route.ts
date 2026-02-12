import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const AssignSchema = z.object({
  driver_id: z.string().uuid("Invalid driver ID"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    // Check authentication
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { job_id } = await params;
    const body = await request.json();
    const { driver_id } = AssignSchema.parse(body);

    const supabase = getServerSupabaseClient();

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .eq("organization_id", session.organization_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Job already ${job.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Verify driver belongs to this organization
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", driver_id)
      .eq("organization_id", session.organization_id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found or doesn't belong to your organization" },
        { status: 404 }
      );
    }

    // Find best available slot
    const { data: slotId, error: slotError } = await supabase.rpc("find_best_slot", {
      p_preferred_date: job.preferred_date,
      p_preferred_time: job.preferred_time,
      p_priority: job.priority,
    });

    if (slotError || !slotId) {
      return NextResponse.json(
        {
          success: false,
          error: "No available slots found for the preferred date/time",
          suggestion: "Try a different date or contact support",
        },
        { status: 400 }
      );
    }

    // Fetch slot details
    const { data: slot } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve slot details" },
        { status: 500 }
      );
    }

    // Generate permit code and QR code
    const { data: permitCode } = await supabase.rpc("generate_permit_code");
    const qrCode = `PERMIT-${job_id.slice(0, 8)}-${Date.now()}`;

    // Create permit
    const { data: permit, error: permitError } = await supabase
      .from("permits")
      .insert({
        driver_id: driver_id,
        slot_id: slotId,
        job_id: job_id,
        qr_code: qrCode,
        permit_code: permitCode || `P-${Date.now().toString().slice(-8)}`,
        cargo_type: job.cargo_type,
        priority: job.priority,
        status: "APPROVED",
        delivery_method: driver.has_smartphone && !driver.prefers_sms ? "APP" : "SMS",
      })
      .select()
      .single();

    if (permitError || !permit) {
      console.error("Failed to create permit:", permitError);
      return NextResponse.json(
        { success: false, error: "Failed to create permit" },
        { status: 500 }
      );
    }

    // Update slot booked count
    await supabase
      .from("time_slots")
      .update({ booked: slot.booked + 1 })
      .eq("id", slotId);

    // Update job status
    await supabase
      .from("jobs")
      .update({
        assigned_driver_id: driver_id,
        permit_id: permit.id,
        status: "ASSIGNED",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    // Update driver availability
    await supabase
      .from("drivers")
      .update({ is_available: false })
      .eq("id", driver_id);

    // Determine notification method
    const deliveryMethod = driver.has_smartphone && !driver.prefers_sms ? "APP" : "SMS";
    let notificationSent = false;

    if (deliveryMethod === "SMS" || driver.prefers_sms) {
      // TODO: Send SMS with permit code (for hackathon, just log)
      console.log(`[SMS] To ${driver.phone}: Job ${job.job_number} assigned. Permit: ${permit.permit_code}. Slot: ${slot.start_time}-${slot.end_time} on ${slot.date}`);
      notificationSent = true;
    } else {
      // TODO: Send push notification (for hackathon, just log)
      console.log(`[PUSH] To ${driver.name}: New job assigned - ${job.job_number}`);
      notificationSent = true;
    }

    console.log(
      `[JOB ASSIGNED] ${job.job_number} → ${driver.name} | Permit: ${permit.permit_code} | Slot: ${slot.date} ${slot.start_time}`
    );

    return NextResponse.json(
      {
        success: true,
        permit: {
          id: permit.id,
          qr_code: permit.qr_code,
          permit_code: permit.permit_code,
          slot_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: permit.status,
          priority: permit.priority,
        },
        driver: {
          name: driver.name,
          phone: driver.phone,
          vehicle_plate: driver.vehicle_plate,
        },
        job: {
          job_number: job.job_number,
          customer_name: job.customer_name,
          cargo_type: job.cargo_type,
        },
        notification_sent: notificationSent,
        delivery_method: deliveryMethod,
        message: "Job assigned and permit generated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Job assignment API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
