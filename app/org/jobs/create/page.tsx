"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer_name: "",
    container_number: "",
    container_count: 1,
    cargo_type: "STANDARD",
    pickup_location: "Dammam Port",
    destination: "",
    preferred_date: "",
    preferred_time: "10:00",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vesselWarning, setVesselWarning] = useState<any>(null);
  const [jobId, setJobId] = useState("");
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/org/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job_id);
        setAvailableDrivers(data.available_drivers);
        setVesselWarning(data.vessel_warning);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to create job");
    }

    setLoading(false);
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/org/jobs/${jobId}/auto-assign`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/org/jobs?success=Auto-assigned to ${data.driver.name} - ${data.permit.permit_code}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to auto-assign driver");
    }
    setLoading(false);
  };

  const handleAssign = async (driverId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/org/jobs/${jobId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: driverId }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/org/jobs?success=Job assigned - ${data.permit.permit_code}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to assign driver");
    }
    setLoading(false);
  };

  if (jobId && availableDrivers.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {vesselWarning && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="font-semibold text-yellow-900">{vesselWarning.message}</p>
            <div className="mt-2">
              <p className="text-sm text-yellow-800">Vessels arriving:</p>
              <ul className="text-sm text-yellow-800">
                {vesselWarning.vessels.map((v: any, i: number) => (
                  <li key={i}>• {v.name} at {v.arrival_time} ({v.estimated_trucks} trucks)</li>
                ))}
              </ul>
              {vesselWarning.suggested_alternatives?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-yellow-800 font-semibold">Suggested times:</p>
                  <ul className="text-sm text-yellow-800">
                    {vesselWarning.suggested_alternatives.map((alt: any, i: number) => (
                      <li key={i}>• {alt.time} ({alt.available} slots, {alt.traffic} traffic)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Select Driver</CardTitle>
            <CardDescription>Choose a driver to assign this job or use auto-assign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">Let the system automatically pick the best available driver:</p>
              <Button onClick={handleAutoAssign} disabled={loading} className="w-full">
                {loading ? "Auto-Assigning..." : "🚀 Auto-Assign Best Driver"}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or manually select</span>
              </div>
            </div>

            <div className="space-y-4">
              {availableDrivers.map((driver) => (
                <div key={driver.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50">
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                    <p className="text-sm text-gray-600">{driver.vehicle_plate} - {driver.vehicle_type}</p>
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                  </div>
                  <Button onClick={() => handleAssign(driver.id)}>Assign</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Create a delivery job and assign it to a driver</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Container Number</Label>
                <Input
                  value={formData.container_number}
                  onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Container Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.container_count}
                  onChange={(e) => setFormData({ ...formData, container_count: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Cargo Type *</Label>
              <Select
                value={formData.cargo_type}
                onValueChange={(v) => setFormData({ ...formData, cargo_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERISHABLE">Perishable (EMERGENCY)</SelectItem>
                  <SelectItem value="MEDICAL">Medical (EMERGENCY)</SelectItem>
                  <SelectItem value="TIME_SENSITIVE">Time Sensitive (ESSENTIAL)</SelectItem>
                  <SelectItem value="STANDARD">Standard (NORMAL)</SelectItem>
                  <SelectItem value="BULK">Bulk (LOW)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pickup Location *</Label>
                <Input
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Destination *</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preferred Date *</Label>
                <Input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label>Preferred Time *</Label>
                <Select
                  value={formData.preferred_time}
                  onValueChange={(v) => setFormData({ ...formData, preferred_time: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => {
                      const hour = i * 2;
                      const time = `${hour.toString().padStart(2, "0")}:00`;
                      return <SelectItem key={time} value={time}>{time}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-900">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
