/**
 * Test API Integration Connection
 *
 * Tests the connection to an organization's configured API.
 * Returns success/failure with vessels found and response time.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { OrganizationAPIClient } from "@/lib/integrations/org-api-client";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getServerSupabaseClient();
  const { id } = params;

  try {
    // Get organization from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("org_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const organizationId = session.organization_id;

    // Get API integration
    const { data: integration, error } = await supabase
      .from("api_integrations")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: "API integration not found" },
        { status: 404 }
      );
    }

    // Test connection
    console.log(`[API Test] Testing connection for integration ${id}`);

    const client = new OrganizationAPIClient(integration);
    const result = await client.testConnection();

    console.log(`[API Test] Result:`, result);

    return NextResponse.json({
      success: result.success,
      ...result,
      message: result.success
        ? `Connected successfully! Found ${result.vessels_found} vessels`
        : `Connection failed: ${result.error}`,
    });
  } catch (error) {
    console.error("[API Test] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 }
    );
  }
}
