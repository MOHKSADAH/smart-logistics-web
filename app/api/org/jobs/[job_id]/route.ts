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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { job_id } = await params;
    const supabase = getServerSupabaseClient();

    // Verify job belongs to organization
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, organization_id, job_number, status")
      .eq("id", job_id)
      .eq("organization_id", session.organization_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Delete the job (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", job_id);

    if (deleteError) {
      console.error("Delete job error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete job" },
        { status: 500 }
      );
    }

    console.log(`[DELETE JOB] Job ${job.job_number} deleted by org ${session.organization_id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Job deleted successfully",
        job_number: job.job_number,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
