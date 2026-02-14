/**
 * Mawani Vessel Sync Cron Job
 *
 * Vercel Cron endpoint that syncs vessel schedules from Mawani port API.
 * Runs every 6 hours to keep vessel data up-to-date.
 *
 * Schedule: 0 */6 * * * (Every 6 hours)
 */

import { NextRequest, NextResponse } from "next/server";
import { vesselSyncService } from "@/lib/vessel-sync-service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel provides this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting Mawani vessel sync...");

    // Run sync
    const result = await vesselSyncService.syncMawaniVessels();

    console.log(
      `[Cron] Mawani sync completed: ${result.records_synced} synced, ${result.records_failed} failed`
    );

    return NextResponse.json({
      success: result.success,
      message: `Synced ${result.records_synced} vessels from Mawani API`,
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Mawani sync error:", error);

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
