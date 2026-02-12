import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// Helper: Get organization from session
async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");

  if (!sessionCookie) {
    return null;
  }

  const session = JSON.parse(sessionCookie.value);

  if (session.expires_at < Date.now()) {
    return null;
  }

  return session;
}

// Zod schema for driver registration
const DriverRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+966[0-9]{9}$/, "Phone must be in format +966XXXXXXXXX"),
  vehicle_plate: z.string().min(1, "Vehicle plate is required"),
  vehicle_type: z.enum(["TRUCK", "CONTAINER", "TANKER", "FLATBED"]),
  employee_id: z.string().optional(),
  has_smartphone: z.boolean().default(true),
  prefers_sms: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getOrgSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = DriverRegistrationSchema.parse(body);

    const supabase = getServerSupabaseClient();

    // Check if driver with this phone already exists
    const { data: existingDriver } = await supabase
      .from("drivers")
      .select("id, name, organization_id")
      .eq("phone", validatedData.phone)
      .single();

    if (existingDriver) {
      // Check if driver belongs to a different organization
      if (existingDriver.organization_id && existingDriver.organization_id !== session.organization_id) {
        return NextResponse.json(
          {
            success: false,
            error: `Driver with phone ${validatedData.phone} already registered with another organization`,
          },
          { status: 409 }
        );
      }

      // If driver exists but not linked to any organization, link them
      if (!existingDriver.organization_id) {
        const { error: updateError } = await supabase
          .from("drivers")
          .update({
            organization_id: session.organization_id,
            employee_id: validatedData.employee_id,
            has_smartphone: validatedData.has_smartphone,
            prefers_sms: validatedData.prefers_sms,
          })
          .eq("id", existingDriver.id);

        if (updateError) {
          console.error("Failed to link driver:", updateError);
          return NextResponse.json(
            { success: false, error: "Failed to link driver to organization" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            driver_id: existingDriver.id,
            message: "Driver linked to organization successfully",
          },
          { status: 200 }
        );
      }

      // Driver already belongs to this organization
      return NextResponse.json(
        {
          success: true,
          driver_id: existingDriver.id,
          message: "Driver already registered with this organization",
        },
        { status: 200 }
      );
    }

    // Create new driver
    const { data: newDriver, error: insertError } = await supabase
      .from("drivers")
      .insert({
        organization_id: session.organization_id,
        name: validatedData.name,
        phone: validatedData.phone,
        vehicle_plate: validatedData.vehicle_plate,
        vehicle_type: validatedData.vehicle_type,
        employee_id: validatedData.employee_id,
        has_smartphone: validatedData.has_smartphone,
        prefers_sms: validatedData.prefers_sms,
        is_available: true,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create driver:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to register driver" },
        { status: 500 }
      );
    }

    console.log(`[DRIVER REGISTERED] ${session.organization_name} → ${newDriver.name} (${newDriver.phone})`);

    // TODO: Send SMS with login credentials (for hackathon, just log it)
    console.log(`[SMS] Send to ${newDriver.phone}: "Welcome to ${session.organization_name}! Login: ${newDriver.phone}"`);

    return NextResponse.json(
      {
        success: true,
        driver_id: newDriver.id,
        driver: {
          id: newDriver.id,
          name: newDriver.name,
          phone: newDriver.phone,
          vehicle_plate: newDriver.vehicle_plate,
          vehicle_type: newDriver.vehicle_type,
        },
        message: "Driver registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    console.error("Driver registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
