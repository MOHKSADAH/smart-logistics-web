/**
 * Demo Organization Helper
 *
 * For hackathon demos - bypasses authentication and uses SMSA org by default
 */

export interface DemoOrgSession {
  organization_id: string;
  organization_name: string;
  email: string;
  authorized_priorities: string[];
  expires_at: number;
}

/**
 * Get demo organization session (hardcoded for hackathon)
 * Always returns SMSA organization - no authentication required
 */
export async function getDemoOrgSession(): Promise<DemoOrgSession> {
  // In a real app, this would query the database
  // For demo, we hardcode the SMSA organization ID
  // This ID will be created by the migration
  return {
    organization_id: "DEMO_ORG_ID", // Will be replaced with actual ID from DB
    organization_name: "SMSA",
    email: "smsa@porta.sa",
    authorized_priorities: ["EMERGENCY", "ESSENTIAL", "NORMAL", "LOW"],
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

/**
 * Get SMSA organization ID directly from database
 * Use this for API endpoints that need the org ID
 */
export async function getSMSAOrgId(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("email", "smsa@porta.sa")
    .single();

  return data?.id || null;
}
