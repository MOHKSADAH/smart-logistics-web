/**
 * Mawani Port API Client
 *
 * Client for integrating with Mawani port API to fetch vessel schedules.
 * For hackathon demo, this uses MOCK DATA instead of real API calls.
 *
 * Production: Replace mock functions with actual API calls.
 */

import type {
  MawaniVessel,
  MawaniVesselDetails,
  MawaniAPIResponse,
} from "./api-types";

export class MawaniClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.MAWANI_API_URL || "https://api.mawani.sa/ports/dammam";
    this.apiKey = process.env.MAWANI_API_KEY || "demo_key";
  }

  /**
   * Get upcoming vessel arrivals for the next N days
   *
   * 🎭 MOCK DATA: Returns generated demo vessels for hackathon
   * Production: Replace with actual API call
   */
  async getUpcomingVessels(days: number = 7): Promise<MawaniVessel[]> {
    // ⚠️ HACKATHON: Mock data generation
    return this.generateMockVessels(days);

    // 🚀 PRODUCTION: Uncomment this for real API integration
    /*
    try {
      const response = await fetch(`${this.apiUrl}/vessels/upcoming?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Mawani API error: ${response.statusText}`);
      }

      const data: MawaniAPIResponse = await response.json();
      return data.vessels;
    } catch (error) {
      console.error('Error fetching vessels from Mawani API:', error);
      throw error;
    }
    */
  }

  /**
   * Get detailed information about a specific vessel
   */
  async getVesselDetails(vesselId: string): Promise<MawaniVesselDetails> {
    // ⚠️ HACKATHON: Mock vessel details
    const vessels = await this.getUpcomingVessels(7);
    const vessel = vessels.find((v) => v.vessel_id === vesselId);

    if (!vessel) {
      throw new Error(`Vessel not found: ${vesselId}`);
    }

    return {
      ...vessel,
      cargo_manifest: this.generateMockCargoManifest(),
      port_charges: Math.floor(Math.random() * 50000) + 10000,
      estimated_departure: this.addDays(vessel.arrival_date, 2),
    };

    // 🚀 PRODUCTION: Real API call
    /*
    const response = await fetch(`${this.apiUrl}/vessels/${vesselId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vessel not found: ${vesselId}`);
    }

    return response.json();
    */
  }

  /**
   * Subscribe to webhook notifications for vessel updates
   */
  async subscribeToWebhook(callbackUrl: string): Promise<void> {
    // ⚠️ HACKATHON: Simulated webhook subscription
    console.log(`[DEMO] Would subscribe to Mawani webhooks at: ${callbackUrl}`);
    return Promise.resolve();

    // 🚀 PRODUCTION: Real webhook subscription
    /*
    const response = await fetch(`${this.apiUrl}/webhooks/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: callbackUrl,
        events: ['VESSEL_ARRIVAL_UPDATED', 'CONGESTION_ALERT'],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to subscribe to webhooks');
    }
    */
  }

  // ============================================================
  // Mock Data Generation (Hackathon Demo)
  // ============================================================

  private generateMockVessels(days: number): MawaniVessel[] {
    const vessels: MawaniVessel[] = [];
    const vesselNames = [
      "MSC TOKYO",
      "MAERSK DUBAI",
      "CMA CGM RIYADH",
      "COSCO SHANGHAI",
      "EVERGREEN PEARL",
      "HAPAG LLOYD EXPRESS",
      "ONE HARMONY",
      "YANG MING TRIUMPH",
    ];

    const berths = ["3A", "3B", "4A", "4B", "5A"];
    const cargoTypeOptions = [
      ["CONTAINER"],
      ["CONTAINER", "BULK"],
      ["BULK"],
      ["CONTAINER", "REFRIGERATED"],
    ];

    // Generate 1-2 vessels per day for the next N days
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const vesselsPerDay = Math.random() > 0.3 ? 2 : 1;

      for (let i = 0; i < vesselsPerDay; i++) {
        const arrivalDate = this.addDays(new Date().toISOString(), dayOffset);
        const arrivalHour = 6 + Math.floor(Math.random() * 6); // 6 AM to 11 AM
        const arrivalMinute = Math.random() > 0.5 ? "00" : "30";

        const estimatedContainers = 200 + Math.floor(Math.random() * 400);
        const estimatedTrucks = Math.floor(estimatedContainers * 1.3); // ~1.3 trucks per container

        vessels.push({
          vessel_id: `MAWANI-2026-${String(vessels.length + 1).padStart(3, "0")}`,
          vessel_name: vesselNames[Math.floor(Math.random() * vesselNames.length)],
          arrival_date: arrivalDate,
          arrival_time: `${String(arrivalHour).padStart(2, "0")}:${arrivalMinute}`,
          berth: berths[Math.floor(Math.random() * berths.length)],
          estimated_containers: estimatedContainers,
          estimated_trucks: estimatedTrucks,
          cargo_types:
            cargoTypeOptions[Math.floor(Math.random() * cargoTypeOptions.length)],
          status: dayOffset === 0 && Math.random() > 0.7 ? "ARRIVED" : "SCHEDULED",
        });
      }
    }

    return vessels;
  }

  private generateMockCargoManifest() {
    const count = 5 + Math.floor(Math.random() * 10);
    const manifest = [];

    const cargoTypes = ["ELECTRONICS", "TEXTILES", "MACHINERY", "FOOD", "CHEMICALS"];
    const destinations = ["Riyadh", "Jeddah", "Mecca", "Medina", "Tabuk"];

    for (let i = 0; i < count; i++) {
      manifest.push({
        container_id: `TCNU${Math.floor(1000000 + Math.random() * 9000000)}`,
        cargo_type: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
        weight_kg: 5000 + Math.floor(Math.random() * 20000),
        destination: destinations[Math.floor(Math.random() * destinations.length)],
      });
    }

    return manifest;
  }

  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }
}

/**
 * Singleton instance for app-wide use
 */
export const mawaniClient = new MawaniClient();
