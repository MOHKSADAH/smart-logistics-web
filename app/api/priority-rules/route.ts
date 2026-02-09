import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServerSupabaseClient();

    const { data: rules, error } = await supabase
      .from("priority_rules")
      .select("*")
      .order("priority_level", { ascending: true });

    if (error) {
      console.error("Error fetching priority rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch priority rules" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, rules: rules || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
