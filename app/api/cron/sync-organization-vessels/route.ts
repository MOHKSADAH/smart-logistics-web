/**
 * Organization Vessel Sync Cron Job
 *
 * Vercel Cron endpoint that syncs vessel data from all active organization APIs.
 * Runs every hour to keep organization-specific shipment data updated.
 *
 * Schedule: 0 * * * * (Every hour)
 */

import { NextRequest, NextResponse } from "next/server";
import { vesselSyncService } from "@/lib/vessel-sync-service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting organization vessel sync...");

    // Sync all active organizations
    const results = await vesselSyncService.syncAllOrganizations();

    // Aggregate results
    const totalSynced = results.reduce((sum, r) => sum + r.records_synced, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.records_failed, 0);
    const allErrors = results.flatMap((r) => r.errors);

    console.log(
      `[Cron] Organization sync completed: ${results.length} orgs processed, ${totalSynced} vessels synced, ${totalFailed} failed`
    );

    return NextResponse.json({
      success: totalFailed === 0,
      message: `Processed ${results.length} organizations, synced ${totalSynced} vessels`,
      organizations_processed: results.length,
      total_synced: totalSynced,
      total_failed: totalFailed,
      errors: allErrors.length > 0 ? allErrors : undefined,
      results,
    });
  } catch (error) {
    console.error("[Cron] Organization sync error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
