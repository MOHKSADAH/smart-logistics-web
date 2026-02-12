import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    .select("*")
    .eq("organization_id", session.organization_id)
    .order("name");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Drivers</h2>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Vehicle</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Smartphone</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers?.map((driver: any) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-semibold">{driver.name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.vehicle_plate}</td>
                    <td>
                      <Badge variant="outline">{driver.vehicle_type}</Badge>
                    </td>
                    <td>
                      {driver.has_smartphone ? (
                        <span className="text-green-600">✓ App</span>
                      ) : (
                        <span className="text-orange-600">SMS Only</span>
                      )}
                    </td>
                    <td>
                      {driver.is_available ? (
                        <Badge className="bg-green-600">Available</Badge>
                      ) : (
                        <Badge variant="secondary">On Job</Badge>
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
