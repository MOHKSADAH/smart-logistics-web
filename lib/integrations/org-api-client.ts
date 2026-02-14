/**
 * Organization API Client
 *
 * Generic client for integrating with organization APIs to fetch
 * their vessel tracking and shipment data.
 *
 * For hackathon demo, this generates MOCK DATA based on organization.
 * Production: Replace with actual API calls to organization endpoints.
 */

import type {
  APIIntegration,
  OrganizationVessel,
  OrganizationShipment,
  OrganizationAPIResponse,
  SyncResult,
  ConnectionTestResult,
} from "./api-types";
import { mawaniClient } from "./mawani-client";

export class OrganizationAPIClient {
  private config: APIIntegration;

  constructor(config: APIIntegration) {
    this.config = config;
  }

  /**
   * Sync vessel data from organization's API
   *
   * 🎭 MOCK DATA: Generates demo shipments for hackathon
   * Production: Replace with actual API call to organization endpoint
   */
  async syncVesselData(): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // ⚠️ HACKATHON: Generate mock data
      const mockData = await this.generateMockOrganizationData();
      const duration = Date.now() - startTime;

      return {
        success: true,
        records_synced: mockData.vessels.length,
        records_failed: 0,
        errors: [],
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };

      // 🚀 PRODUCTION: Real API call
      /*
      const response = await fetch(this.config.api_endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Organization API error: ${response.statusText}`);
      }

      const data: OrganizationAPIResponse = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: true,
        records_synced: data.vessels.length,
        records_failed: 0,
        errors: [],
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
      */
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
   * Validate webhook signature from organization
   */
  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // ⚠️ HACKATHON: Always return true for demo
    return true;

    // 🚀 PRODUCTION: Real signature validation
    /*
    if (!this.config.webhook_secret) {
      return false;
    }

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhook_secret);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

    return signature === expectedSignature;
    */
  }

  /**
   * Test connection to organization's API
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // ⚠️ HACKATHON: Simulated connection test
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      const mockData = await this.generateMockOrganizationData();

      return {
        success: true,
        vessels_found: mockData.vessels.length,
        response_time_ms: Date.now() - startTime,
      };

      // 🚀 PRODUCTION: Real connection test
      /*
      const response = await fetch(this.config.api_endpoint, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          response_time_ms: Date.now() - startTime,
        };
      }

      // Try to get vessel count
      const dataResponse = await fetch(this.config.api_endpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
        },
      });

      const data: OrganizationAPIResponse = await dataResponse.json();

      return {
        success: true,
        vessels_found: data.vessels.length,
        response_time_ms: Date.now() - startTime,
      };
      */
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
        response_time_ms: Date.now() - startTime,
      };
    }
  }

  // ============================================================
  // Mock Data Generation (Hackathon Demo)
  // ============================================================

  private async generateMockOrganizationData(): Promise<OrganizationAPIResponse> {
    // Get upcoming vessels from Mawani
    const mawaniVessels = await mawaniClient.getUpcomingVessels(7);

    // Select 2-4 random vessels for this organization
    const vesselsToTrack = this.selectRandomVessels(mawaniVessels, 2, 4);

    const organizationVessels: OrganizationVessel[] = vesselsToTrack.map(
      (mawaniVessel) => {
        const shipments = this.generateMockShipments(mawaniVessel.vessel_name);
        const total_trucks = shipments.reduce(
          (sum, s) => sum + s.estimated_trucks,
          0
        );

        return {
          vessel_name: mawaniVessel.vessel_name,
          arrival_date: mawaniVessel.arrival_date,
          shipments,
          total_trucks,
        };
      }
    );

    return {
      vessels: organizationVessels,
      timestamp: new Date().toISOString(),
      organization_id: this.config.organization_id,
    };
  }

  private generateMockShipments(vesselName: string): OrganizationShipment[] {
    const shipmentCount = 3 + Math.floor(Math.random() * 5); // 3-7 shipments
    const shipments: OrganizationShipment[] = [];

    const cargoTypes: Array<OrganizationShipment["cargo_type"]> = [
      "MEDICAL",
      "PERISHABLE",
      "TIME_SENSITIVE",
      "STANDARD",
      "BULK",
    ];

    const priorityMapping = {
      MEDICAL: "EMERGENCY" as const,
      PERISHABLE: "EMERGENCY" as const,
      TIME_SENSITIVE: "ESSENTIAL" as const,
      STANDARD: "NORMAL" as const,
      BULK: "LOW" as const,
    };

    const destinations = [
      "Riyadh",
      "Jeddah",
      "Mecca",
      "Medina",
      "Tabuk",
      "Dammam",
      "Khobar",
    ];

    for (let i = 0; i < shipmentCount; i++) {
      const cargoType =
        cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
      const containerCount = 1 + Math.floor(Math.random() * 3); // 1-3 containers
      const containers: string[] = [];

      for (let j = 0; j < containerCount; j++) {
        containers.push(
          `${this.getOrgPrefix()}${Math.floor(1000000 + Math.random() * 9000000)}`
        );
      }

      shipments.push({
        shipment_number: `${this.getOrgPrefix()}-2026-${String(i + 1).padStart(4, "0")}`,
        containers,
        cargo_type: cargoType,
        priority: priorityMapping[cargoType],
        estimated_trucks: containerCount,
        destination: destinations[Math.floor(Math.random() * destinations.length)],
        notes: this.generateShipmentNotes(cargoType),
      });
    }

    return shipments;
  }

  private selectRandomVessels(
    vessels: any[],
    min: number,
    max: number
  ): any[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...vessels].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, vessels.length));
  }

  private getOrgPrefix(): string {
    // Extract organization prefix from email or use generic
    if (this.config.organization_id.includes("smsa")) return "SMSA";
    if (this.config.organization_id.includes("aramex")) return "ARX";
    if (this.config.organization_id.includes("naqel")) return "NQL";
    return "ORG";
  }

  private generateShipmentNotes(cargoType: string): string {
    const notes: Record<string, string[]> = {
      MEDICAL: [
        "Temperature controlled - maintain 2-8°C",
        "Vaccines - handle with care",
        "Medical supplies for King Fahd Hospital",
      ],
      PERISHABLE: [
        "Fresh produce - deliver within 24h",
        "Refrigerated cargo - maintain cold chain",
        "Food items - priority delivery",
      ],
      TIME_SENSITIVE: [
        "E-commerce packages - next-day delivery",
        "JIT manufacturing parts",
        "Express courier service",
      ],
      STANDARD: [
        "Standard container shipment",
        "General cargo",
        "Non-urgent delivery",
      ],
      BULK: [
        "Bulk materials",
        "Construction materials",
        "Industrial goods",
      ],
    };

    const typeNotes = notes[cargoType] || notes.STANDARD;
    return typeNotes[Math.floor(Math.random() * typeNotes.length)];
  }
}
