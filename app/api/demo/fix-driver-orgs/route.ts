import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * Fix drivers by assigning them to organizations
 * Useful for hackathon demos when seed data doesn't include org_id
 */
export async function POST() {
  try {
    const supabase = getServerSupabaseClient();

    // Get ALL organizations for even distribution
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!orgs || orgs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No organizations found in database" },
        { status: 404 }
      );
    }

    // Get all drivers
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, name, organization_id");

    if (!drivers || drivers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No drivers found in database" },
        { status: 404 }
      );
    }

    // Distribute ALL drivers evenly across organizations (even if they already have org)
    // This ensures each org has available drivers for demo purposes
    const updates = [];
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const org = orgs[i % orgs.length]; // Round-robin assignment

      const { error } = await supabase
        .from("drivers")
        .update({
          organization_id: org.id,
          is_available: true, // Also reset availability
          is_active: true // Ensure they're active
        })
        .eq("id", driver.id);

      if (!error) {
        updates.push({
          driver: driver.name,
          assigned_to: org.name,
          org_id: org.id
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updates.length} drivers assigned to organizations`,
      updates,
      organizations: orgs.map(o => ({ id: o.id, name: o.name })),
    });
  } catch (error) {
    console.error("Fix driver orgs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
