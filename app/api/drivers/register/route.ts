import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

// Zod schema for driver registration
const DriverRegistrationSchema = z.object({
  id: z.string().uuid("Invalid driver ID"),
  phone: z.string().regex(/^\+966[0-9]{9}$/, "Phone must be in E.164 format: +966XXXXXXXXX"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  vehicle_plate: z.string().min(1, "Vehicle plate is required"),
  vehicle_type: z.enum(["TRUCK", "CONTAINER", "TANKER", "FLATBED"], {
    errorMap: () => ({ message: "Vehicle type must be TRUCK, CONTAINER, TANKER, or FLATBED" }),
  }),
  push_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = DriverRegistrationSchema.parse(body);

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Check if driver already exists by ID or phone
    const { data: existingDriver, error: checkError } = await supabase
      .from("drivers")
      .select("*")
      .or(`id.eq.${validatedData.id},phone.eq.${validatedData.phone}`)
      .single();

    // If driver exists, return existing data (idempotent)
    if (existingDriver && !checkError) {
      console.log(`[DRIVER EXISTS] ${existingDriver.id} - ${existingDriver.name}`);
      return NextResponse.json(
        {
          success: true,
          driver: {
            id: existingDriver.id,
            phone: existingDriver.phone,
            name: existingDriver.name,
            vehicle_plate: existingDriver.vehicle_plate,
            vehicle_type: existingDriver.vehicle_type,
            is_active: existingDriver.is_active,
            created_at: existingDriver.created_at,
          },
          message: "Driver already registered",
        },
        { status: 200 }
      );
    }

    // Create new driver
    const { data: newDriver, error: insertError } = await supabase
      .from("drivers")
      .insert({
        id: validatedData.id,
        phone: validatedData.phone,
        name: validatedData.name,
        vehicle_plate: validatedData.vehicle_plate,
        vehicle_type: validatedData.vehicle_type,
        push_token: validatedData.push_token || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to register driver:", insertError);

      // Handle specific database errors
      if (insertError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { success: false, error: "Driver with this phone or ID already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to register driver" },
        { status: 500 }
      );
    }

    console.log(`[DRIVER REGISTERED] ${newDriver.id} - ${newDriver.name}`, {
      phone: newDriver.phone,
      vehicle: `${newDriver.vehicle_type} ${newDriver.vehicle_plate}`,
    });

    return NextResponse.json(
      {
        success: true,
        driver: {
          id: newDriver.id,
          phone: newDriver.phone,
          name: newDriver.name,
          vehicle_plate: newDriver.vehicle_plate,
          vehicle_type: newDriver.vehicle_type,
          is_active: newDriver.is_active,
          created_at: newDriver.created_at,
        },
        message: "Driver registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validationErrors,
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
