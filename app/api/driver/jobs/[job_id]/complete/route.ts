import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/driver/jobs/[job_id]/complete
 *
 * Marks a job as completed by the driver
 * Updates: job status → COMPLETED, driver availability → true, permit status → COMPLETED
 *
 * Authentication: Supabase Auth Bearer token
 *
 * Body:
 * {
 *   completion_notes?: string,
 *   completed_at?: string (ISO timestamp, defaults to now)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Job marked as completed",
 *   job: { id, job_number, status, completed_at },
 *   driver_status: "available"
 * }
 */

// Validation schema
const CompletionSchema = z.object({
  completion_notes: z.string().optional(),
  completed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "Invalid ISO timestamp")
    .optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await context.params;

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: "job_id is required in URL path" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CompletionSchema.parse(body);

    const completedAt =
      validatedData.completed_at || new Date().toISOString();

    const supabase = getServerSupabaseClient();

    // 1. Get job details to verify it exists and get driver_id
    const { data: job, error: jobFetchError } = await supabase
      .from("jobs")
      .select("id, job_number, status, assigned_driver_id, permit_id")
      .eq("id", job_id)
      .single();

    if (jobFetchError || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify job is in a completable state
    if (job.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Job is already completed",
          job_number: job.job_number,
        },
        { status: 400 }
      );
    }

    if (job.status === "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Job is not assigned yet, cannot complete",
          job_number: job.job_number,
        },
        { status: 400 }
      );
    }

    if (job.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "Job is cancelled, cannot complete",
          job_number: job.job_number,
        },
        { status: 400 }
      );
    }

    // 2. Update job status to COMPLETED
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        status: "COMPLETED",
        completed_at: completedAt,
        notes: validatedData.completion_notes
          ? `${job.notes || ""}\n\n[COMPLETION] ${validatedData.completion_notes}`.trim()
          : job.notes,
      })
      .eq("id", job_id);

    if (jobUpdateError) {
      console.error("Failed to update job:", jobUpdateError);
      return NextResponse.json(
        { success: false, error: "Failed to complete job" },
        { status: 500 }
      );
    }

    // 3. Update permit status to COMPLETED (if exists)
    if (job.permit_id) {
      const { error: permitUpdateError } = await supabase
        .from("permits")
        .update({
          status: "COMPLETED",
        })
        .eq("id", job.permit_id);

      if (permitUpdateError) {
        console.error("Failed to update permit:", permitUpdateError);
        // Don't fail the request, just log the error
      }
    }

    // 4. Update driver availability to true (ready for new assignments)
    if (job.assigned_driver_id) {
      const { error: driverUpdateError } = await supabase
        .from("drivers")
        .update({
          is_available: true,
        })
        .eq("id", job.assigned_driver_id);

      if (driverUpdateError) {
        console.error("Failed to update driver availability:", driverUpdateError);
        // Don't fail the request, just log the error
      }
    }

    console.log(
      `[JOB COMPLETED] ${job.job_number} by driver ${job.assigned_driver_id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Job marked as completed. You are now available for new assignments.",
        job: {
          job_id: job.id,
          job_number: job.job_number,
          status: "COMPLETED",
          completed_at: completedAt,
        },
        driver_status: "available",
      },
      { status: 200 }
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

    console.error("Job completion API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
