import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import { DashboardClient } from "./dashboard-client";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  return JSON.parse(sessionCookie.value);
}

export default async function OrgDashboardPage() {
  const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  // Fetch stats with parallel queries for performance
  const [jobsResult, driversResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, job_number, customer_name, status, completed_at")
      .eq("organization_id", session.organization_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("drivers")
      .select("id, is_available")
      .eq("organization_id", session.organization_id),
  ]);

  const jobs = jobsResult.data || [];
  const drivers = driversResult.data || [];

  const stats = {
    activeJobs: jobs.filter((j) => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length,
    completedToday: jobs.filter(
      (j) =>
        j.status === "COMPLETED" &&
        j.completed_at &&
        new Date(j.completed_at).toDateString() === new Date().toDateString()
    ).length,
    availableDrivers: drivers.filter((d) => d.is_available).length,
    totalDrivers: drivers.length,
    recentJobs: jobs.slice(0, 5),
  };

  return <DashboardClient stats={stats} />;
}
