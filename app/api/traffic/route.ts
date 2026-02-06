import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";
import {
  TrafficApiRequest,
  TrafficApiResponse,
  HaltPermitsResponse,
} from "@/lib/types";

// Zod schema for incoming traffic data from Team 3 (AI/YOLO)
const TrafficUpdateSchema = z.object({
  camera_id: z.string().min(1, "camera_id is required"),
  timestamp: z.string().datetime("Invalid ISO 8601 timestamp"),
  status: z.enum(["NORMAL", "MODERATE", "CONGESTED"]),
  vehicle_count: z.number().int().min(0),
  truck_count: z.number().int().min(0),
  recommendation: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate incoming request
    const body = await request.json();
    const validatedData: TrafficApiRequest = TrafficUpdateSchema.parse(body);

    // Initialize Supabase client with service role key
    const supabase = getServerSupabaseClient();

    // Insert traffic update into database
    const { data: trafficData, error: insertError } = await supabase
      .from("traffic_updates")
      .insert({
        camera_id: validatedData.camera_id,
        timestamp: validatedData.timestamp,
        status: validatedData.status,
        vehicle_count: validatedData.vehicle_count,
        truck_count: validatedData.truck_count,
        recommendation: validatedData.recommendation || null,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert traffic update:", insertError);
      return NextResponse.json(
        { success: false, message: "Failed to record traffic update" },
        { status: 500 }
      );
    }

    // If traffic status is CONGESTED, halt NORMAL and LOW priority permits
    let permitsAffected = 0;
    let permitsProtected = 0;

    if (validatedData.status === "CONGESTED") {
      // Call the PostgreSQL function to halt permits by priority
      const { data: haltResult, error: haltError } = await supabase.rpc(
        "halt_permits_by_priority",
        {
          traffic_status: "CONGESTED",
        }
      );

      if (haltError) {
        console.error("Failed to halt permits:", haltError);
        return NextResponse.json(
          { success: false, message: "Failed to process halt logic" },
          { status: 500 }
        );
      }

      // Extract results from the RPC function
      if (haltResult && haltResult.length > 0) {
        const result = haltResult[0] as HaltPermitsResponse;
        permitsAffected = result.halted_count;
        permitsProtected = result.protected_count;
      }

      // Log the action for audit trail
      console.log(`[TRAFFIC ALERT] ${validatedData.status}`, {
        camera: validatedData.camera_id,
        vehicles: validatedData.vehicle_count,
        trucks: validatedData.truck_count,
        permitsHalted: permitsAffected,
        permitsProtected: permitsProtected,
      });
    }

    // Return success response with impact metrics
    const response: TrafficApiResponse = {
      success: true,
      permits_affected: permitsAffected,
      permits_protected: permitsProtected,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    console.error("Traffic API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Optional: GET handler to check endpoint health
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/traffic",
    description: "Receives traffic updates from AI camera system (Team 3)",
    method: "POST",
  });
}
