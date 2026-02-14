import { getServerSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import AnalyticsClient from "./analytics-client";

export default async function OrgAnalyticsPage() {
  const supabase = getServerSupabaseClient();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");

  if (!sessionCookie) {
    return <div>Not authenticated</div>;
  }

  const session = JSON.parse(sessionCookie.value);
  const organizationId = session.organization_id;

  // Get jobs data for this organization
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, permits(*)")
    .eq("organization_id", organizationId);

  const allJobs = jobs || [];

  // Calculate metrics
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter((j) => j.status === "COMPLETED").length;
  const pendingJobs = allJobs.filter((j) => j.status === "PENDING").length;
  const inProgressJobs = allJobs.filter(
    (j) => j.status === "IN_PROGRESS",
  ).length;

  // Priority distribution
  const priorityData = [
    {
      priority: "EMERGENCY",
      count: allJobs.filter((j) => j.priority === "EMERGENCY").length,
      fill: "#EF4444",
    },
    {
      priority: "ESSENTIAL",
      count: allJobs.filter((j) => j.priority === "ESSENTIAL").length,
      fill: "#F59E0B",
    },
    {
      priority: "NORMAL",
      count: allJobs.filter((j) => j.priority === "NORMAL").length,
      fill: "#3B82F6",
    },
    {
      priority: "LOW",
      count: allJobs.filter((j) => j.priority === "LOW").length,
      fill: "#6B7280",
    },
  ].filter((d) => d.count > 0);

  // Jobs by week (last 4 weeks)
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekJobs = allJobs.filter((j) => {
      const jobDate = new Date(j.created_at);
      return jobDate >= weekStart && jobDate < weekEnd;
    });

    return {
      week: `Week ${i + 1}`,
      jobs: weekJobs.length,
    };
  });

  // Get drivers count
  const { count: driversCount } = await supabase
    .from("drivers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const { count: availableDriversCount } = await supabase
    .from("drivers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_available", true)
    .eq("is_active", true);

  return (
    <AnalyticsClient
      totalJobs={totalJobs}
      completedJobs={completedJobs}
      pendingJobs={pendingJobs}
      inProgressJobs={inProgressJobs}
      priorityData={priorityData}
      weeklyData={weeklyData}
      driversCount={driversCount || 0}
      availableDriversCount={availableDriversCount || 0}
    />
  );
}
