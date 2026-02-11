import { getServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = getServerSupabaseClient();
    const { permit_id } = await request.json();

    if (!permit_id) {
      return NextResponse.json(
        { error: "permit_id is required" },
        { status: 400 },
      );
    }

    // Update permit status to CANCELLED
    const { data: permit, error } = await supabase
      .from("permits")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", permit_id)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling permit:", error);
      return NextResponse.json(
        { error: "Failed to cancel permit" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, permit });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
