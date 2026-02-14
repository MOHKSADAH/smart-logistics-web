/**
 * Manual API Sync Trigger
 *
 * Manually triggers a vessel data sync for an organization's API integration.
 * Useful for testing or forcing an immediate sync outside the schedule.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { vesselSyncService } from "@/lib/vessel-sync-service";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getServerSupabaseClient();
  const { id } = params;

  try {
    // Get organization from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const organizationId = session.organization_id;

    // Get API integration
    const { data: integration, error } = await supabase
      .from("api_integrations")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: "API integration not found" },
        { status: 404 }
      );
    }

    // Trigger sync
    console.log(`[Manual Sync] Starting sync for organization ${organizationId}`);

    const result = await vesselSyncService.syncOrganizationVessels(organizationId);

    console.log(`[Manual Sync] Completed:`, result);

    return NextResponse.json({
      success: result.success,
      ...result,
      message: result.success
        ? `Synced ${result.records_synced} vessels successfully`
        : `Sync failed: ${result.errors.join(", ")}`,
    });
  } catch (error) {
    console.error("[Manual Sync] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
