/**
 * Mawani Port Webhook Endpoint
 *
 * Receives real-time vessel updates from Mawani port API.
 * For hackathon demo, this accepts all webhooks without signature validation.
 *
 * Production: Add HMAC signature validation using MAWANI_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import type { MawaniWebhookPayload } from "@/lib/integrations/api-types";

export async function POST(request: NextRequest) {
  const supabase = getServerSupabaseClient();

  try {
    const signature = request.headers.get("x-mawani-signature");
    const payload: MawaniWebhookPayload = await request.json();

    // ⚠️ HACKATHON: Skip signature validation for demo
    // 🚀 PRODUCTION: Verify signature with MAWANI_WEBHOOK_SECRET
    /*
    const webhookSecret = process.env.MAWANI_WEBHOOK_SECRET;
    if (webhookSecret && !verifySignature(payload, signature, webhookSecret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    */

    console.log(`[Webhook] Received Mawani event: ${payload.event_type} for vessel ${payload.vessel_id}`);

    // Process different event types
    switch (payload.event_type) {
      case "VESSEL_ARRIVAL_UPDATED":
        await handleVesselArrivalUpdated(payload);
        break;

      case "VESSEL_DEPARTED":
        await handleVesselDeparted(payload);
        break;

      case "BERTH_CHANGED":
        await handleBerthChanged(payload);
        break;

      case "CONGESTION_ALERT":
        await handleCongestionAlert(payload);
        break;

      default:
        console.warn(`[Webhook] Unknown event type: ${payload.event_type}`);
    }

    // Log webhook event
    await supabase.from("api_sync_logs").insert({
      api_integration_id: null, // Mawani is global
      sync_type: "WEBHOOK",
      status: "SUCCESS",
      records_synced: 1,
      errors: null,
      duration_ms: 0,
    });

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[Webhook] Error processing Mawani webhook:", error);

    // Log error
    await supabase.from("api_sync_logs").insert({
      api_integration_id: null,
      sync_type: "WEBHOOK",
      status: "FAILED",
      records_synced: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      duration_ms: 0,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// Event Handlers
// ============================================================

async function handleVesselArrivalUpdated(payload: MawaniWebhookPayload) {
  const supabase = getServerSupabaseClient();

  console.log(`[Webhook] Updating vessel arrival: ${payload.vessel_id}`);

  // Update vessel_schedules with new arrival info
  const { error } = await supabase
    .from("vessel_schedules")
    .update({
      arrival_date: payload.data.arrival_date,
      arrival_time: payload.data.arrival_time,
      estimated_trucks: payload.data.estimated_trucks,
      synced_at: new Date().toISOString(),
    })
    .eq("external_vessel_id", payload.vessel_id);

  if (error) {
    console.error("[Webhook] Failed to update vessel:", error);
    throw error;
  }

  // TODO: Notify affected organizations about the change
  // This would trigger notifications to orgs with jobs on this vessel
}

async function handleVesselDeparted(payload: MawaniWebhookPayload) {
  console.log(`[Webhook] Vessel departed: ${payload.vessel_id}`);

  // TODO: Mark vessel as departed in database
  // TODO: Update related jobs/permits
}

async function handleBerthChanged(payload: MawaniWebhookPayload) {
  console.log(`[Webhook] Berth changed for vessel: ${payload.vessel_id}`);

  // TODO: Update berth information
  // This might affect pickup times for organizations
}

async function handleCongestionAlert(payload: MawaniWebhookPayload) {
  console.log(`[Webhook] Congestion alert from Mawani`);

  // TODO: Trigger congestion response
  // This would call the existing permit halting logic
}

// ============================================================
// Helper Functions
// ============================================================

function verifySignature(
  payload: any,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const expectedSignature = hmac.update(JSON.stringify(payload)).digest("hex");

  return signature === expectedSignature;
}
