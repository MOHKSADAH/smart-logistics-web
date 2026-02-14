import { notFound } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase";
import { TrackingMap } from "@/components/tracking-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Package, User, FileText } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ job_id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function JobTrackingPage({ params, searchParams }: PageProps) {
  const { job_id } = await params;
  const { lang } = await searchParams;
  const supabase = getServerSupabaseClient();

  // Fetch job with driver and permit details
  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      job_number,
      customer_name,
      cargo_type,
      priority,
      status,
      pickup_location,
      delivery_location,
      created_at,
      assigned_driver_id
    `)
    .eq("id", job_id)
    .single();

  if (error || !job) {
    notFound();
  }

  // Fetch driver details
  let driver = null;
  if (job.assigned_driver_id) {
    const { data: driverData } = await supabase
      .from("drivers")
      .select("id, name, phone, vehicle_plate")
      .eq("id", job.assigned_driver_id)
      .single();
    driver = driverData;
  }

  // Fetch permit details
  const { data: permit } = await supabase
    .from("permits")
    .select("permit_code, status, qr_code")
    .eq("job_id", job_id)
    .single();

  // Fetch latest driver location
  let currentLocation = null;
  if (job.assigned_driver_id) {
    const { data: locationData } = await supabase
      .from("driver_locations")
      .select("latitude, longitude, speed, heading, timestamp")
      .eq("driver_id", job.assigned_driver_id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();
    currentLocation = locationData;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/org/jobs?lang=${lang || "en"}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 me-2" />
        Back to Jobs
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Track Job</h1>
        <p className="text-muted-foreground mt-2">
          Real-time location tracking for {job.job_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(600px-73px)]">
              <TrackingMap
                jobId={job_id}
                driverId={job.assigned_driver_id}
                currentLocation={currentLocation}
                pickupLocation={{ name: job.pickup_location || "Dammam Port", lat: 26.4207, lng: 50.0888 }}
                deliveryLocation={{ name: job.delivery_location || "Customer Location", lat: 26.4367, lng: 50.1036 }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Details Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Job Number</p>
                <p className="font-mono font-medium">{job.job_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{job.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo Type</p>
                <p>{job.cargo_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge
                  variant={
                    job.priority === "EMERGENCY"
                      ? "destructive"
                      : job.priority === "ESSENTIAL"
                      ? "default"
                      : "secondary"
                  }
                >
                  {job.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    job.status === "COMPLETED"
                      ? "default"
                      : job.status === "ASSIGNED"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {job.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Driver Details */}
          {driver && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-mono">{driver.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Plate</p>
                  <p className="font-mono font-medium">{driver.vehicle_plate}</p>
                </div>
                {currentLocation && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p>{currentLocation.speed || 0} km/h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Update</p>
                      <p className="text-sm">
                        {new Date(currentLocation.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Permit Details */}
          {permit && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Permit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Permit Code</p>
                  <p className="font-mono font-medium">{permit.permit_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={permit.status === "APPROVED" ? "default" : "secondary"}>
                    {permit.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <p className="font-mono text-xs break-all">{permit.qr_code}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
