"use server";

import { getServerSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updatePermitStatus(
  permitId: string,
  newStatus: "APPROVED" | "HALTED" | "CANCELLED"
) {
  const supabase = getServerSupabaseClient();

  const { data, error } = await supabase
    .from("permits")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", permitId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/permits");
  revalidatePath("/");

  return { success: true, data };
}

export async function haltPermit(permitId: string) {
  return updatePermitStatus(permitId, "HALTED");
}

export async function approvePermit(permitId: string) {
  return updatePermitStatus(permitId, "APPROVED");
}

export async function cancelPermit(permitId: string) {
  return updatePermitStatus(permitId, "CANCELLED");
}

export async function reschedulePermit(permitId: string, newSlotId: string) {
  const supabase = getServerSupabaseClient();

  // Update permit with new slot
  const { data, error } = await supabase
    .from("permits")
    .update({
      slot_id: newSlotId,
      status: "APPROVED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", permitId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/permits");
  revalidatePath("/");

  return { success: true, data };
}

export async function createPermit(formData: {
  driverId: string;
  slotId: string;
  cargoType: string;
  priority: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
  vesselId?: string;
}) {
  const supabase = getServerSupabaseClient();

  // Generate QR code (simple format for demo)
  const qrCode = `PRM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const { data, error } = await supabase
    .from("permits")
    .insert({
      driver_id: formData.driverId,
      slot_id: formData.slotId,
      cargo_type: formData.cargoType,
      priority: formData.priority,
      vessel_id: formData.vesselId || null,
      qr_code: qrCode,
      status: "APPROVED",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/permits");
  revalidatePath("/");

  return { success: true, data };
}
