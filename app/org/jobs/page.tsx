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
  // Skip session check for hackathon demo
  // const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  // Fetch jobs
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!jobsData) {
    return <JobsClient jobs={[]} />;
  }

  // Fetch all drivers and permits
  const { data: allDrivers } = await supabase.from("drivers").select("id, name, vehicle_plate");
  const { data: allPermits } = await supabase.from("permits").select("id, permit_code, status");

  // Create lookup maps
  const driversMap = new Map(allDrivers?.map(d => [d.id, d]) || []);
  const permitsMap = new Map(allPermits?.map(p => [p.id, p]) || []);

  // Enrich jobs with driver and permit data
  const jobs = jobsData.map((job: any) => ({
    id: job.id,
    job_number: job.job_number,
    customer_name: job.customer_name,
    cargo_type: job.cargo_type,
    priority: job.priority,
    status: job.status,
    driver: job.assigned_driver_id ? driversMap.get(job.assigned_driver_id) || null : null,
    permit: job.permit_id ? permitsMap.get(job.permit_id) || null : null,
  }));

  return <JobsClient jobs={jobs} />;
}
