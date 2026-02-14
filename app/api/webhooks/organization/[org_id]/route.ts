/**
 * Organization Webhook Endpoint
 *
 * Receives real-time vessel/shipment updates from organization APIs.
 * For hackathon demo, this accepts all webhooks without signature validation.
 *
 * Production: Add HMAC signature validation using organization's webhook_secret
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import type { OrganizationWebhookPayload } from "@/lib/integrations/api-types";

export async function POST(
  request: NextRequest,
  { params }: { params: { org_id: string } }
) {
  const supabase = getServerSupabaseClient();
  const { org_id } = params;

  try {
    const signature = request.headers.get("x-organization-signature");
    const payload: OrganizationWebhookPayload = await request.json();

    // Get organization's webhook secret
    const { data: integration } = await supabase
      .from("api_integrations")
      .select("webhook_secret")
      .eq("organization_id", org_id)
      .eq("is_active", true)
      .single();

    // ⚠️ HACKATHON: Skip signature validation for demo
    // 🚀 PRODUCTION: Verify signature
    /*
    if (integration?.webhook_secret && !verifySignature(payload, signature, integration.webhook_secret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    */

    console.log(
      `[Webhook] Received organization event: ${payload.event_type} from org ${org_id}`
    );

    // Process different event types
    switch (payload.event_type) {
      case "VESSEL_ADDED":
        await handleVesselAdded(org_id, payload);
        break;

      case "SHIPMENT_UPDATED":
        await handleShipmentUpdated(org_id, payload);
        break;

      case "VESSEL_CANCELLED":
        await handleVesselCancelled(org_id, payload);
        break;

      default:
        console.warn(`[Webhook] Unknown event type: ${payload.event_type}`);
    }

    // Log webhook event
    const { data: apiIntegration } = await supabase
      .from("api_integrations")
      .select("id")
      .eq("organization_id", org_id)
      .single();

    if (apiIntegration) {
      await supabase.from("api_sync_logs").insert({
        api_integration_id: apiIntegration.id,
        sync_type: "WEBHOOK",
        status: "SUCCESS",
        records_synced: 1,
        errors: null,
        duration_ms: 0,
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing organization webhook for ${org_id}:`, error);

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

async function handleVesselAdded(orgId: string, payload: OrganizationWebhookPayload) {
  const supabase = getServerSupabaseClient();

  console.log(`[Webhook] Organization ${orgId} added vessel: ${payload.data.vessel_name}`);

  // Add to organization_vessel_tracking
  if (payload.data.vessel_name && payload.data.shipments) {
    const shipmentNumbers = payload.data.shipments.map((s) => s.shipment_number);
    const containerNumbers = payload.data.shipments.flatMap((s) => s.containers);
    const cargoTypes = [...new Set(payload.data.shipments.map((s) => s.cargo_type))];

    const priorityBreakdown: Record<string, number> = {};
    payload.data.shipments.forEach((s) => {
      priorityBreakdown[s.priority] = (priorityBreakdown[s.priority] || 0) + 1;
    });

    const { error } = await supabase.from("organization_vessel_tracking").insert({
      organization_id: orgId,
      vessel_name: payload.data.vessel_name,
      arrival_date: payload.timestamp.split("T")[0], // Extract date from timestamp
      shipment_numbers: shipmentNumbers,
      container_numbers: containerNumbers,
      cargo_types: cargoTypes,
      priority_breakdown: priorityBreakdown,
      estimated_trucks: payload.data.shipments.reduce(
        (sum, s) => sum + s.estimated_trucks,
        0
      ),
      source: "API",
      synced_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Webhook] Failed to add vessel:", error);
      throw error;
    }
  }
}

async function handleShipmentUpdated(
  orgId: string,
  payload: OrganizationWebhookPayload
) {
  console.log(`[Webhook] Organization ${orgId} updated shipment on vessel: ${payload.data.vessel_name}`);

  // TODO: Update specific shipment in organization_vessel_tracking
  // This would modify the shipment_numbers and container_numbers arrays
}

async function handleVesselCancelled(
  orgId: string,
  payload: OrganizationWebhookPayload
) {
  const supabase = getServerSupabaseClient();

  console.log(`[Webhook] Organization ${orgId} cancelled vessel: ${payload.data.vessel_name}`);

  // Remove from organization_vessel_tracking
  if (payload.data.vessel_name) {
    const { error } = await supabase
      .from("organization_vessel_tracking")
      .delete()
      .eq("organization_id", orgId)
      .eq("vessel_name", payload.data.vessel_name);

    if (error) {
      console.error("[Webhook] Failed to cancel vessel:", error);
      throw error;
    }
  }

  // TODO: Notify affected jobs that vessel was cancelled
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
