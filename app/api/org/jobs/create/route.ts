import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// Types
interface VesselInfo {
  name: string;
  arrival_time: string;
  estimated_trucks: number;
  cargo_priority: string;
}

interface AlternativeSlot {
  time: string;
  available: number;
  traffic: string;
}

interface VesselWarning {
  vessels: VesselInfo[];
  total_trucks: number;
  expected_congestion: string;
  message: string;
  suggested_alternatives: AlternativeSlot[];
  priority_protected: boolean;
}

// Helper: Get organization from session
async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  const session = JSON.parse(sessionCookie.value);
  if (session.expires_at < Date.now()) return null;
  return session;
}

// Zod schema for job creation
const JobCreationSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  container_number: z.string().optional(),
  container_count: z.number().int().min(1).default(1),
  cargo_type: z.enum([
    "PERISHABLE",
    "MEDICAL",
    "TIME_SENSITIVE",
    "STANDARD",
    "BULK",
  ]),
  pickup_location: z.string().min(1, "Pickup location is required"),
  destination: z.string().min(1, "Destination is required"),
  preferred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Parse and validate
    const body = await request.json();
    const validatedData = JobCreationSchema.parse(body);

    const supabase = getServerSupabaseClient();

    // Get priority from cargo type
    const { data: priorityData } = await supabase.rpc(
      "get_priority_from_cargo",
      {
        cargo_type: validatedData.cargo_type,
      },
    );
    const priority = priorityData || "NORMAL";

    // Check if organization is authorized for this priority
    if (!session.authorized_priorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: `Your organization is not authorized to create ${priority} priority jobs. Contact admin to upgrade authorization.`,
          authorized_priorities: session.authorized_priorities,
        },
        { status: 403 },
      );
    }

    // Generate job number
    const jobNumber = `JOB-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`;

    // Create job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        organization_id: session.organization_id,
        job_number: jobNumber,
        customer_name: validatedData.customer_name,
        container_number: validatedData.container_number,
        container_count: validatedData.container_count,
        cargo_type: validatedData.cargo_type,
        priority,
        pickup_location: validatedData.pickup_location,
        destination: validatedData.destination,
        preferred_date: validatedData.preferred_date,
        preferred_time: validatedData.preferred_time,
        notes: validatedData.notes,
        status: "PENDING",
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("Failed to create job:", jobError);
      return NextResponse.json(
        { success: false, error: "Failed to create job" },
        { status: 500 },
      );
    }

    // Parallel fetch: drivers + vessels in one go
    const [driversResult, vesselsResult] = await Promise.all([
      supabase
        .from("drivers")
        .select("id, name, phone, vehicle_plate, vehicle_type")
        .eq("organization_id", session.organization_id)
        .eq("is_available", true)
        .eq("is_active", true)
        .order("name")
        .limit(10),
      supabase
        .from("vessel_schedules")
        .select("vessel_name, arrival_time, estimated_trucks, cargo_priority")
        .eq("arrival_date", validatedData.preferred_date)
        .eq("status", "SCHEDULED")
        .order("arrival_time"),
    ]);

    const drivers = driversResult.data || [];
    const vessels = vesselsResult.data || [];

    // Calculate vessel warning
    let vesselWarning: VesselWarning | null = null;
    if (vessels && vessels.length > 0) {
      const totalTrucks = vessels.reduce(
        (sum, v) => sum + v.estimated_trucks,
        0,
      );
      const preferredHour = parseInt(
        validatedData.preferred_time.split(":")[0],
      );

      // Check if preferred time is in surge window (8am-2pm)
      if (preferredHour >= 8 && preferredHour < 14 && totalTrucks > 400) {
        // Calculate expected congestion
        const expectedCongestion = totalTrucks > 600 ? "CONGESTED" : "MODERATE";

        // Suggest alternative slots
        const { data: allSlots } = await supabase
          .from("time_slots")
          .select("*")
          .eq("date", validatedData.preferred_date)
          .eq("status", "AVAILABLE")
          .neq("predicted_traffic", "CONGESTED")
          .order("predicted_traffic")
          .order("start_time");

        const altSlots = allSlots
          ?.filter((s) => s.booked < s.capacity)
          .slice(0, 5);

        vesselWarning = {
          vessels: vessels.map((v) => ({
            name: v.vessel_name,
            arrival_time: v.arrival_time,
            estimated_trucks: v.estimated_trucks,
            cargo_priority: v.cargo_priority,
          })),
          total_trucks: totalTrucks,
          expected_congestion: expectedCongestion,
          message: `⚠️ ${vessels.length} vessels arriving ${validatedData.preferred_date}, ${totalTrucks} trucks expected. Heavy traffic 8am-2pm.`,
          suggested_alternatives:
            altSlots?.map((slot) => ({
              time: `${slot.start_time} - ${slot.end_time}`,
              available: slot.capacity - slot.booked,
              traffic: slot.predicted_traffic,
            })) || [],
          priority_protected:
            priority === "EMERGENCY" || priority === "ESSENTIAL",
        };
      }
    }

    console.log(
      `[JOB CREATED] ${session.organization_name} → ${job.job_number} (${priority})`,
    );
    if (vesselWarning) {
      console.log(
        `[VESSEL WARNING] ${vesselWarning.total_trucks} trucks expected on ${validatedData.preferred_date}`,
      );
    }

    return NextResponse.json(
      {
        success: true,
        job_id: job.id,
        job_number: job.job_number,
        priority,
        available_drivers: drivers || [],
        vessel_warning: vesselWarning,
        message: "Job created successfully",
      },
      { status: 201 },
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
        { status: 400 },
      );
    }

    console.error("Job creation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
