/**
 * Vessel Sync Service
 *
 * Business logic for syncing vessel data from Mawani API and organization APIs.
 * Handles data transformation, database operations, and logging.
 */

import { getServerSupabaseClient } from "@/lib/supabase";
import { mawaniClient } from "./integrations/mawani-client";
import { OrganizationAPIClient } from "./integrations/org-api-client";
import type {
  SyncResult,
  MawaniVessel,
  OrganizationVessel,
  APIIntegration,
} from "./integrations/api-types";

export class VesselSyncService {
  /**
   * Sync vessels from Mawani port API
   * Updates vessel_schedules table with source='MAWANI_API'
   */
  async syncMawaniVessels(): Promise<SyncResult> {
    const startTime = Date.now();
    const supabase = getServerSupabaseClient();

    try {
      console.log("[Mawani Sync] Starting vessel sync...");

      // Fetch vessels from Mawani API (mock data in hackathon)
      const vessels = await mawaniClient.getUpcomingVessels(7);

      console.log(`[Mawani Sync] Fetched ${vessels.length} vessels`);

      // Upsert vessels to database
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const vessel of vessels) {
        try {
          const { error } = await supabase.from("vessel_schedules").upsert(
            {
              vessel_name: vessel.vessel_name,
              arrival_date: vessel.arrival_date,
              arrival_time: vessel.arrival_time,
              estimated_trucks: vessel.estimated_trucks,
              source: "MAWANI_API",
              synced_at: new Date().toISOString(),
              external_vessel_id: vessel.vessel_id,
            },
            {
              onConflict: "vessel_name,arrival_date", // Prevent duplicates
            }
          );

          if (error) {
            failCount++;
            errors.push(`${vessel.vessel_name}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          failCount++;
          errors.push(
            `${vessel.vessel_name}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      const duration = Date.now() - startTime;

      console.log(
        `[Mawani Sync] Completed: ${successCount} success, ${failCount} failed in ${duration}ms`
      );

      // Log sync result
      await supabase.from("api_sync_logs").insert({
        api_integration_id: null, // Mawani is global, not org-specific
        sync_type: "POLL",
        status: failCount === 0 ? "SUCCESS" : failCount < vessels.length ? "PARTIAL" : "FAILED",
        records_synced: successCount,
        errors: errors.length > 0 ? errors : null,
        duration_ms: duration,
      });

      return {
        success: failCount === 0,
        records_synced: successCount,
        records_failed: failCount,
        errors,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      console.error("[Mawani Sync] Fatal error:", errorMessage);

      // Log failure
      await supabase.from("api_sync_logs").insert({
        api_integration_id: null,
        sync_type: "POLL",
        status: "FAILED",
        records_synced: 0,
        errors: [errorMessage],
        duration_ms: duration,
      });

      return {
        success: false,
        records_synced: 0,
        records_failed: 1,
        errors: [errorMessage],
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sync vessels from organization's API
   * Updates organization_vessel_tracking table
   */
  async syncOrganizationVessels(organizationId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const supabase = getServerSupabaseClient();

    try {
      console.log(`[Org Sync] Starting sync for organization: ${organizationId}`);

      // Get API integration config
      const { data: integration, error: integrationError } = await supabase
        .from("api_integrations")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .eq("api_type", "VESSEL_TRACKING")
        .single();

      if (integrationError || !integration) {
        throw new Error(`No active API integration found for org: ${organizationId}`);
      }

      // Fetch data from organization API
      const client = new OrganizationAPIClient(integration);
      const syncResult = await client.syncVesselData();

      if (!syncResult.success) {
        throw new Error(`API sync failed: ${syncResult.errors.join(", ")}`);
      }

      // Get the actual data (mock for hackathon)
      const mockData = await this.getMockOrganizationData(integration);

      // Upsert to organization_vessel_tracking
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const vessel of mockData.vessels) {
        try {
          // Calculate priority breakdown
          const priorityBreakdown = this.calculatePriorityBreakdown(vessel);

          // Extract shipment and container numbers
          const shipmentNumbers = vessel.shipments.map((s) => s.shipment_number);
          const containerNumbers = vessel.shipments.flatMap((s) => s.containers);
          const cargoTypes = [...new Set(vessel.shipments.map((s) => s.cargo_type))];

          const { error } = await supabase
            .from("organization_vessel_tracking")
            .upsert(
              {
                organization_id: organizationId,
                vessel_name: vessel.vessel_name,
                arrival_date: vessel.arrival_date,
                estimated_trucks: vessel.total_trucks,
                estimated_containers: vessel.shipments.reduce(
                  (sum, s) => sum + s.containers.length,
                  0
                ),
                shipment_numbers: shipmentNumbers,
                container_numbers: containerNumbers,
                cargo_types: cargoTypes,
                priority_breakdown: priorityBreakdown,
                source: "API",
                api_integration_id: integration.id,
                synced_at: new Date().toISOString(),
              },
              {
                onConflict: "organization_id,vessel_name,arrival_date",
              }
            );

          if (error) {
            failCount++;
            errors.push(`${vessel.vessel_name}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          failCount++;
          errors.push(
            `${vessel.vessel_name}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      const duration = Date.now() - startTime;

      console.log(
        `[Org Sync] Completed for ${organizationId}: ${successCount} success, ${failCount} failed`
      );

      // Update integration last_sync timestamp
      await supabase
        .from("api_integrations")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: failCount === 0 ? "SUCCESS" : "PARTIAL",
          last_sync_error: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", integration.id);

      // Log sync result
      await supabase.from("api_sync_logs").insert({
        api_integration_id: integration.id,
        sync_type: "POLL",
        status:
          failCount === 0
            ? "SUCCESS"
            : failCount < mockData.vessels.length
              ? "PARTIAL"
              : "FAILED",
        records_synced: successCount,
        errors: errors.length > 0 ? errors : null,
        duration_ms: duration,
      });

      return {
        success: failCount === 0,
        records_synced: successCount,
        records_failed: failCount,
        errors,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      console.error(`[Org Sync] Fatal error for ${organizationId}:`, errorMessage);

      return {
        success: false,
        records_synced: 0,
        records_failed: 1,
        errors: [errorMessage],
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sync all active organization integrations
   */
  async syncAllOrganizations(): Promise<SyncResult[]> {
    const supabase = getServerSupabaseClient();

    // Get all active integrations
    const { data: integrations, error } = await supabase
      .from("api_integrations")
      .select("organization_id")
      .eq("is_active", true)
      .eq("api_type", "VESSEL_TRACKING");

    if (error || !integrations) {
      console.error("[Org Sync] Failed to fetch integrations:", error);
      return [];
    }

    console.log(`[Org Sync] Syncing ${integrations.length} organizations`);

    // Sync each organization
    const results = await Promise.all(
      integrations.map((integration) =>
        this.syncOrganizationVessels(integration.organization_id)
      )
    );

    return results;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private calculatePriorityBreakdown(vessel: OrganizationVessel) {
    const breakdown: Record<string, number> = {};

    for (const shipment of vessel.shipments) {
      breakdown[shipment.priority] = (breakdown[shipment.priority] || 0) + 1;
    }

    return breakdown;
  }

  private async getMockOrganizationData(integration: APIIntegration) {
    const client = new OrganizationAPIClient(integration);
    // This calls the mock data generator
    const startTime = Date.now();
    await client.syncVesselData();

    // Generate and return mock data (hackathon workaround)
    const mawaniVessels = await mawaniClient.getUpcomingVessels(7);
    const selectedVessels = mawaniVessels.slice(0, 3);

    return {
      vessels: selectedVessels.map((v) => ({
        vessel_name: v.vessel_name,
        arrival_date: v.arrival_date,
        shipments: this.generateMockShipments(),
        total_trucks: Math.floor(Math.random() * 20) + 5,
      })),
    };
  }

  private generateMockShipments() {
    const count = 3 + Math.floor(Math.random() * 3);
    const shipments = [];

    for (let i = 0; i < count; i++) {
      const priorities: Array<"EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW"> = [
        "EMERGENCY",
        "ESSENTIAL",
        "NORMAL",
        "LOW",
      ];
      const cargoTypes: Array<"MEDICAL" | "PERISHABLE" | "TIME_SENSITIVE" | "STANDARD" | "BULK"> = [
        "MEDICAL",
        "PERISHABLE",
        "TIME_SENSITIVE",
        "STANDARD",
        "BULK",
      ];

      shipments.push({
        shipment_number: `SHIP-${Date.now()}-${i}`,
        containers: [`CNT${Math.floor(Math.random() * 1000000)}`],
        cargo_type: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        estimated_trucks: 1 + Math.floor(Math.random() * 3),
      });
    }

    return shipments;
  }
}

/**
 * Singleton instance for app-wide use
 */
export const vesselSyncService = new VesselSyncService();
