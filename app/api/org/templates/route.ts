/**
 * Job Templates API
 *
 * CRUD endpoints for managing reusable job templates.
 * Allows organizations to save frequently used job configurations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { z } from "zod";

const JobTemplateSchema = z.object({
  template_name: z.string().min(1, "Template name is required"),
  cargo_type: z.enum(["PERISHABLE", "MEDICAL", "TIME_SENSITIVE", "STANDARD", "BULK"]),
  priority: z.enum(["EMERGENCY", "ESSENTIAL", "NORMAL", "LOW"]),
  pickup_location: z.string().min(1, "Pickup location is required"),
  destination: z.string().min(1, "Destination is required"),
  notes: z.string().optional(),
});

/**
 * GET /api/org/templates
 * Fetch all templates for the organization
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

    // Fetch templates
    const { data: templates, error } = await supabase
      .from("job_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/org/templates
 * Create a new job template
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
    const validatedData = JobTemplateSchema.parse(body);

    // Create template
    const { data: template, error } = await supabase
      .from("job_templates")
      .insert({
        organization_id: organizationId,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
      message: "Template created successfully",
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
 * PATCH /api/org/templates?id=xxx
 * Update an existing template
 */
export async function PATCH(request: NextRequest) {
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
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = JobTemplateSchema.partial().parse(body);

    // Update template (RLS ensures only org's own templates can be updated)
    const { data: template, error } = await supabase
      .from("job_templates")
      .update(validatedData)
      .eq("id", templateId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
      message: "Template updated successfully",
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
 * DELETE /api/org/templates?id=xxx
 * Delete a template
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
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    // Delete template (RLS ensures only org's own templates can be deleted)
    const { error } = await supabase
      .from("job_templates")
      .delete()
      .eq("id", templateId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
