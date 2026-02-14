import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * Reset all drivers to available status
 * Useful for hackathon demos when all drivers get marked unavailable
 */
export async function POST() {
  try {
    const supabase = getServerSupabaseClient();

    // Reset all drivers to available
    const { error } = await supabase
      .from("drivers")
      .update({ is_available: true })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

    if (error) {
      console.error("Failed to reset drivers:", error);
      return NextResponse.json(
        { success: false, error: "Failed to reset drivers" },
        { status: 500 }
      );
    }

    // Count how many drivers were reset
    const { count } = await supabase
      .from("drivers")
      .select("*", { count: "exact", head: true })
      .eq("is_available", true);

    return NextResponse.json({
      success: true,
      message: `${count || 0} drivers reset to available`,
      drivers_available: count || 0,
    });
  } catch (error) {
    console.error("Reset drivers error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
