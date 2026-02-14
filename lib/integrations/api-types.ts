/**
 * API Integration Type Definitions
 *
 * Type definitions for Mawani port API and organization API responses.
 * Used for vessel tracking and shipment data integration.
 */

// ============================================================
// Mawani Port API Types
// ============================================================

export interface MawaniVessel {
  vessel_id: string; // Mawani's unique vessel identifier
  vessel_name: string; // e.g., "MSC TOKYO"
  arrival_date: string; // ISO date: "2026-02-15"
  arrival_time: string; // Time: "08:30"
  berth: string; // e.g., "3A"
  estimated_containers: number;
  estimated_trucks: number;
  cargo_types: string[]; // e.g., ["CONTAINER", "BULK"]
  status: "SCHEDULED" | "ARRIVED" | "DEPARTED" | "DELAYED";
}

export interface MawaniVesselDetails extends MawaniVessel {
  cargo_manifest: {
    container_id: string;
    cargo_type: string;
    weight_kg: number;
    destination: string;
  }[];
  port_charges: number;
  estimated_departure: string;
}

export interface MawaniAPIResponse {
  vessels: MawaniVessel[];
  timestamp: string;
  port_status: "NORMAL" | "CONGESTED" | "CLOSED";
}

// ============================================================
// Organization API Types
// ============================================================

export interface OrganizationShipment {
  shipment_number: string; // e.g., "SMSA-2026-1234"
  containers: string[]; // Container IDs: ["TCNU1234567", "MSCU9876543"]
  cargo_type: "PERISHABLE" | "MEDICAL" | "TIME_SENSITIVE" | "STANDARD" | "BULK";
  priority: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
  estimated_trucks: number;
  destination?: string;
  notes?: string;
}

export interface OrganizationVessel {
  vessel_name: string; // Must match Mawani vessel name
  arrival_date: string; // ISO date
  shipments: OrganizationShipment[];
  total_trucks: number;
}

export interface OrganizationAPIResponse {
  vessels: OrganizationVessel[];
  timestamp: string;
  organization_id?: string;
}

// ============================================================
// Internal Database Types
// ============================================================

export interface APIIntegration {
  id: string;
  organization_id: string;
  api_type: "VESSEL_TRACKING" | "SHIPMENT_DATA" | "CONTAINER_STATUS";
  api_endpoint: string;
  api_key: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  sync_frequency_minutes: number;
  last_sync_at: string | null;
  last_sync_status: "SUCCESS" | "FAILED" | "PENDING" | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationVesselTracking {
  id: string;
  organization_id: string;
  vessel_name: string;
  vessel_id: string | null;
  arrival_date: string;
  arrival_time: string | null;
  estimated_containers: number;
  estimated_trucks: number;
  shipment_numbers: string[];
  container_numbers: string[];
  cargo_types: string[];
  priority_breakdown: {
    EMERGENCY?: number;
    ESSENTIAL?: number;
    NORMAL?: number;
    LOW?: number;
  };
  source: "API" | "MANUAL";
  api_integration_id: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface APISyncLog {
  id: string;
  api_integration_id: string | null;
  sync_type: "POLL" | "WEBHOOK" | "MANUAL";
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  records_synced: number;
  errors: any[] | null;
  duration_ms: number | null;
  created_at: string;
}

// ============================================================
// Sync Result Types
// ============================================================

export interface SyncResult {
  success: boolean;
  records_synced: number;
  records_failed: number;
  errors: string[];
  duration_ms: number;
  timestamp: string;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  vessels_found?: number;
  response_time_ms?: number;
}

// ============================================================
// Webhook Payload Types
// ============================================================

export interface MawaniWebhookPayload {
  vessel_id: string;
  event_type: "VESSEL_ARRIVAL_UPDATED" | "VESSEL_DEPARTED" | "BERTH_CHANGED" | "CONGESTION_ALERT";
  data: Partial<MawaniVessel>;
  timestamp: string;
}

export interface OrganizationWebhookPayload {
  organization_id: string;
  event_type: "VESSEL_ADDED" | "SHIPMENT_UPDATED" | "VESSEL_CANCELLED";
  data: {
    vessel_name?: string;
    shipments?: OrganizationShipment[];
  };
  timestamp: string;
}
