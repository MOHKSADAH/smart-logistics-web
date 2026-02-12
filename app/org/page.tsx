import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  return JSON.parse(sessionCookie.value);
}


export default async function OrgDashboardPage() {
  const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  // Fetch stats
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("organization_id", session.organization_id);

  const activeJobs = jobs?.filter(j => j.status === "ASSIGNED" || j.status === "IN_PROGRESS").length || 0;
  const completedToday = jobs?.filter(j =>
    j.status === "COMPLETED" &&
    j.completed_at &&
    new Date(j.completed_at).toDateString() === new Date().toDateString()
  ).length || 0;

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .eq("organization_id", session.organization_id);

  const availableDrivers = drivers?.filter(d => d.is_available).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link href="/org/jobs/create">
          <Button size="lg">+ Create New Job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{availableDrivers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drivers?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobs?.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">{job.job_number}</p>
                  <p className="text-sm text-gray-600">{job.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${
                  job.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                  job.status === "ASSIGNED" ? "bg-blue-100 text-blue-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {job.status}
                </span>
              </div>
            )) || <p className="text-gray-500">No jobs yet. Create your first job!</p>}
          </div>
          <Link href="/org/jobs">
            <Button variant="link" className="mt-4">View All Jobs →</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
