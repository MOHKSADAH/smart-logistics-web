import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import { DriversClient } from "./drivers-client";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  return JSON.parse(sessionCookie.value);
}

export default async function DriversPage() {
  const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, phone, vehicle_plate, vehicle_type, has_smartphone, is_available, is_active")
    .eq("organization_id", session.organization_id)
    .order("name");

  return <DriversClient drivers={drivers || []} />;
}
