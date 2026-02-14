/**
 * Organization API Integration Management
 *
 * CRUD endpoints for managing organization API configurations.
 * Allows organizations to configure their vessel tracking API integration.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { z } from "zod";

const APIIntegrationSchema = z.object({
  api_type: z.enum(["VESSEL_TRACKING", "SHIPMENT_DATA", "CONTAINER_STATUS"]),
  api_endpoint: z.string().url("Must be a valid URL"),
  api_key: z.string().optional(),
  webhook_secret: z.string().optional(),
  is_active: z.boolean().default(true),
  sync_frequency_minutes: z.number().min(15).max(1440).default(60),
});

/**
 * GET /api/org/api-integration
 * Fetch organization's API integrations
 */
export async function GET(request: NextRequest) {
  const supabase = getServerSupabaseClient();

  try {
    // Get organization from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const organizationId = session.organization_id;

    // Fetch integrations
    const { data: integrations, error } = await supabase
      .from("api_integrations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API integrations:", error);
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/org/api-integration
 * Create or update API integration configuration
 */
export async function POST(request: NextRequest) {
  const supabase = getServerSupabaseClient();

  try {
    // Get organization from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const organizationId = session.organization_id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = APIIntegrationSchema.parse(body);

    // Upsert integration (update if exists, create if new)
    const { data: integration, error } = await supabase
      .from("api_integrations")
      .upsert(
        {
          organization_id: organizationId,
          ...validatedData,
          last_sync_status: "PENDING",
        },
        {
          onConflict: "organization_id,api_type",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving API integration:", error);
      return NextResponse.json(
        { error: "Failed to save integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      integration,
      message: "API integration configured successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/org/api-integration
 * Delete an API integration
 */
export async function DELETE(request: NextRequest) {
  const supabase = getServerSupabaseClient();

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const organizationId = session.organization_id;

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("id");

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    // Delete integration (RLS ensures only org's own integrations can be deleted)
    const { error } = await supabase
      .from("api_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting API integration:", error);
      return NextResponse.json(
        { error: "Failed to delete integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API integration deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
