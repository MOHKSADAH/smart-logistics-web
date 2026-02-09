import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

// Zod schema for booking request
const BookingSchema = z.object({
  driver_id: z.string().uuid("Invalid driver ID"),
  slot_id: z.string().uuid("Invalid slot ID"),
  cargo_type: z.string().min(1, "Cargo type is required"),
  vessel_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Generate QR code string (simplified for hackathon)
function generateQRCode(): string {
  return `PERMIT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Calculate expiration time (24 hours after slot end time)
function calculateExpiration(slotDate: string, slotEndTime: string): string {
  const dateTime = new Date(`${slotDate}T${slotEndTime}`);
  dateTime.setHours(dateTime.getHours() + 24);
  return dateTime.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = BookingSchema.parse(body);

    // Initialize Supabase client
    const supabase = getServerSupabaseClient();

    // Check if slot exists and is available
    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", validatedData.slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { success: false, message: "Time slot not found" },
        { status: 404 },
      );
    }

    // Check slot availability
    if (slot.status === "FULL" || slot.booked >= slot.capacity) {
      return NextResponse.json(
        { success: false, message: "Time slot is full" },
        { status: 400 },
      );
    }

    if (slot.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Time slot is closed" },
        { status: 400 },
      );
    }

    // Check if driver exists
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", validatedData.driver_id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 },
      );
    }

    // Determine priority level based on cargo type
    const { data: priorityRule, error: priorityRuleError } = await supabase
      .from("priority_rules")
      .select("priority_level")
      .eq("cargo_type", validatedData.cargo_type)
      .single();

    if (priorityRuleError) {
      console.warn(
        "Priority rule lookup failed, defaulting to NORMAL:",
        priorityRuleError,
      );
    }

    const priority = priorityRule?.priority_level || "NORMAL";

    // Generate QR code and calculate expiration
    const qrCode = generateQRCode();
    const expiresAt = calculateExpiration(slot.date, slot.end_time);

    // Create permit
    const { data: permit, error: permitError } = await supabase
      .from("permits")
      .insert({
        driver_id: validatedData.driver_id,
        slot_id: validatedData.slot_id,
        vessel_id: validatedData.vessel_id || null,
        qr_code: qrCode,
        cargo_type: validatedData.cargo_type,
        priority: priority,
        status: "APPROVED",
        approved_at: new Date().toISOString(),
        expires_at: expiresAt,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (permitError) {
      console.error("Failed to create permit:", permitError);
      return NextResponse.json(
        { success: false, message: "Failed to create permit" },
        { status: 500 },
      );
    }

    // Send notification to driver (simplified - just log for hackathon)
    await supabase.from("notifications").insert({
      driver_id: validatedData.driver_id,
      permit_id: permit.id,
      title: "Permit Approved",
      body: `Your permit for ${slot.date} ${slot.start_time}-${slot.end_time} has been approved.`,
      type: "APPROVAL",
      data: { permit_id: permit.id, qr_code: qrCode },
    });

    console.log(`[PERMIT CREATED] ${permit.id} - ${priority} priority`, {
      driver: driver.name,
      slot: `${slot.date} ${slot.start_time}-${slot.end_time}`,
      cargo: validatedData.cargo_type,
    });

    // Return success with permit details
    return NextResponse.json(
      {
        success: true,
        permit: {
          id: permit.id,
          qr_code: permit.qr_code,
          status: permit.status,
          priority: permit.priority,
          cargo_type: permit.cargo_type,
          expires_at: permit.expires_at,
          slot: {
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
          },
        },
        message: "Permit booked successfully",
      },
      { status: 201 },
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
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 },
      );
    }

    // Handle generic errors
    console.error("Booking API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
