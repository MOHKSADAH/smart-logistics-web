import { getServerSupabaseClient } from "@/lib/supabase";
import { VesselsClient } from "./vessels-client";

export default async function OrgVesselsPage() {
  const supabase = getServerSupabaseClient();

  // Get upcoming vessels for next 7 days
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: vessels } = await supabase
    .from("vessel_schedules")
    .select("*")
    .gte("arrival_date", today)
    .lte("arrival_date", sevenDaysLater)
    .order("arrival_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  const upcomingVessels = vessels || [];

  return <VesselsClient vessels={upcomingVessels} />;
}
