import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import { JobsClient } from "./jobs-client";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  return JSON.parse(sessionCookie.value);
}

export default async function JobsListPage() {
  const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  const { data: jobsData } = await supabase
    .from("jobs")
    .select(`
      id,
      job_number,
      customer_name,
      cargo_type,
      priority,
      status,
      driver:drivers!assigned_driver_id (name, vehicle_plate),
      permit:permits!permit_id (permit_code, status)
    `)
    .eq("organization_id", session.organization_id)
    .order("created_at", { ascending: false });

  // Transform Supabase array responses to single objects
  const jobs = (jobsData || []).map((job: any) => ({
    ...job,
    driver: Array.isArray(job.driver) && job.driver.length > 0 ? job.driver[0] : null,
    permit: Array.isArray(job.permit) && job.permit.length > 0 ? job.permit[0] : null,
  }));

  return <JobsClient jobs={jobs} />;
}
