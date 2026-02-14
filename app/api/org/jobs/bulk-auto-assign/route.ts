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

export async function POST(request: NextRequest) {
  try {
    // Skip session check for hackathon demo
    // const session = await getOrgSession();
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: "Not authenticated" },
    //     { status: 401 }
    //   );
    // }

    const supabase = getServerSupabaseClient();

    // Get all pending jobs (all organizations for demo)
    const { data: pendingJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, job_number, preferred_date, preferred_time, priority, cargo_type, organization_id")
      // .eq("organization_id", session.organization_id) // Disabled for demo
      .eq("status", "PENDING")
      .order("priority", { ascending: false }); // Process high priority first

    if (jobsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch pending jobs" },
        { status: 500 }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          assigned: 0,
          failed: 0,
          message: "No pending jobs to assign",
        },
        { status: 200 }
      );
    }

    const results = {
      assigned: 0,
      failed: 0,
      details: [] as Array<{
        job_number: string;
        success: boolean;
        driver?: string;
        permit_code?: string;
        error?: string;
      }>,
    };

    // Process each job
    for (const job of pendingJobs) {
      try {
        // Find best available driver from job's organization
        const { data: drivers, error: driversError } = await supabase
          .from("drivers")
          .select("id, name, phone, vehicle_plate, has_smartphone, prefers_sms")
          .eq("organization_id", job.organization_id) // Use job's org instead of session
          .eq("is_available", true)
          .eq("is_active", true)
          .limit(1);

        if (driversError || !drivers || drivers.length === 0) {
          results.failed++;
          results.details.push({
            job_number: job.job_number,
            success: false,
            error: "No available drivers",
          });
          continue;
        }

        const driver = drivers[0];

        // Find best time slot
        const { data: slot_id, error: slotError } = await supabase.rpc("find_best_slot", {
          p_preferred_date: job.preferred_date,
          p_preferred_time: job.preferred_time,
          p_priority: job.priority,
        });

        if (!slot_id || slotError) {
          results.failed++;
          results.details.push({
            job_number: job.job_number,
            success: false,
            error: "No available time slots",
          });
          continue;
        }

        // Generate permit code
        const { data: permitCode } = await supabase.rpc("generate_permit_code");
        const qrCode = `PERMIT-${job.id.slice(0, 8)}-${Date.now()}`;

        // Create permit
        const { data: permit, error: permitError } = await supabase
          .from("permits")
          .insert({
            driver_id: driver.id,
            slot_id: slot_id,
            job_id: job.id,
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
          results.failed++;
          results.details.push({
            job_number: job.job_number,
            success: false,
            error: "Failed to create permit",
          });
          continue;
        }

        // Update job with driver and permit
        await supabase
          .from("jobs")
          .update({
            assigned_driver_id: driver.id,
            permit_id: permit.id,
            status: "ASSIGNED",
          })
          .eq("id", job.id);

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

        results.assigned++;
        results.details.push({
          job_number: job.job_number,
          success: true,
          driver: driver.name,
          permit_code: permit.permit_code,
        });

        console.log(
          `[BULK-ASSIGN] Job ${job.job_number} → Driver ${driver.name} → Permit ${permit.permit_code}`
        );
      } catch (error) {
        results.failed++;
        results.details.push({
          job_number: job.job_number,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        assigned: results.assigned,
        failed: results.failed,
        total: pendingJobs.length,
        details: results.details,
        message: `Successfully assigned ${results.assigned} out of ${pendingJobs.length} jobs`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk auto-assign error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
