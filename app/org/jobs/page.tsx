import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoAssignButton } from "./auto-assign-button";

async function getOrgSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("org_session");
  if (!sessionCookie) return null;
  return JSON.parse(sessionCookie.value);
}

export default async function JobsListPage() {
  const session = await getOrgSession();
  const supabase = getServerSupabaseClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      *,
      driver:drivers!assigned_driver_id (name, vehicle_plate),
      permit:permits!permit_id (permit_code, status)
    `)
    .eq("organization_id", session.organization_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Jobs</h2>
        <Link href="/org/jobs/create">
          <Button>+ Create Job</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">Job Number</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Cargo</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Driver</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Permit</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs?.map((job: any) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <Link href={`/org/jobs/${job.id}/track`} className="text-blue-600 hover:underline">
                        {job.job_number}
                      </Link>
                    </td>
                    <td>{job.customer_name}</td>
                    <td>{job.cargo_type}</td>
                    <td>
                      <Badge variant={
                        job.priority === "EMERGENCY" ? "destructive" :
                        job.priority === "ESSENTIAL" ? "default" : "secondary"
                      }>
                        {job.priority}
                      </Badge>
                    </td>
                    <td>{job.driver?.name || "-"}</td>
                    <td>
                      <Badge variant={
                        job.status === "COMPLETED" ? "default" :
                        job.status === "ASSIGNED" ? "secondary" : "outline"
                      }>
                        {job.status}
                      </Badge>
                    </td>
                    <td>{job.permit?.permit_code || "-"}</td>
                    <td>
                      {job.status === "PENDING" && (
                        <AutoAssignButton jobId={job.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
