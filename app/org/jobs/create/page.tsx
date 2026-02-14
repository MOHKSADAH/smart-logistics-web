"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { toast } from "sonner";
import { Database, Loader2, CheckCircle, Package } from "lucide-react";

function CreateJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";
  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) => getOrgTranslation(locale, key);
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

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);

  const demoCompanies = ["SMSA Express", "Aramex", "Naqel Express", "DHL Saudi Arabia", "FedEx KSA"];
  const demoContainers = ["MSCU", "CSNU", "TEMU", "OOLU", "HLBU"];

  const fetchFromDatabase = async () => {
    setImportDialogOpen(true);
    setImportLoading(true);
    setImportedData(null);

    // Simulate fetching from database with delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const randomCompany = demoCompanies[Math.floor(Math.random() * demoCompanies.length)];
    const randomContainer = demoContainers[Math.floor(Math.random() * demoContainers.length)];
    const containerNum = `${randomContainer}${Math.floor(Math.random() * 9000000) + 1000000}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fetchedData = {
      customer_name: randomCompany,
      container_number: containerNum,
      container_count: Math.floor(Math.random() * 3) + 1,
      cargo_type: ["PERISHABLE", "MEDICAL", "TIME_SENSITIVE", "STANDARD", "BULK"][Math.floor(Math.random() * 5)],
      pickup_location: "Dammam Port",
      destination: ["Riyadh Logistics Hub", "Jeddah Distribution Center", "Al Khobar Warehouse", "Dhahran Industrial Zone"][Math.floor(Math.random() * 4)],
      preferred_date: tomorrow.toISOString().split('T')[0],
      preferred_time: ["06:00", "08:00", "10:00", "14:00", "16:00", "18:00"][Math.floor(Math.random() * 6)],
      notes: `Imported from permit database - Permit #${Math.floor(Math.random() * 90000) + 10000}`,
      source_system: "SMSA Logistics Database",
      import_timestamp: new Date().toISOString(),
    };

    setImportedData(fetchedData);
    setImportLoading(false);
  };

  const importData = () => {
    if (importedData) {
      setFormData({
        customer_name: importedData.customer_name,
        container_number: importedData.container_number,
        container_count: importedData.container_count,
        cargo_type: importedData.cargo_type,
        pickup_location: importedData.pickup_location,
        destination: importedData.destination,
        preferred_date: importedData.preferred_date,
        preferred_time: importedData.preferred_time,
        notes: importedData.notes,
      });
      setImportDialogOpen(false);
      toast.success("Data imported successfully!");
    }
  };

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
        router.push(`/org/jobs?lang=${locale}&success=Auto-assigned to ${data.driver.name} - ${data.permit.permit_code}`);
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
        router.push(`/org/jobs?lang=${locale}&success=Job assigned - ${data.permit.permit_code}`);
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
      <div className="max-w-4xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
        {vesselWarning && (
          <div className="bg-accent/50 border-2 border-border rounded-lg p-4">
            <p className="font-semibold text-foreground">{vesselWarning.message}</p>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t("vesselWarningLabel")}</p>
              <ul className="text-sm text-muted-foreground">
                {vesselWarning.vessels.map((v: any, i: number) => (
                  <li key={i}>• {v.name} {t("at")} {v.arrival_time} ({v.estimated_trucks} {t("trucks")})</li>
                ))}
              </ul>
              {vesselWarning.suggested_alternatives?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-foreground font-semibold">{t("suggestedTimes")}</p>
                  <ul className="text-sm text-muted-foreground">
                    {vesselWarning.suggested_alternatives.map((alt: any, i: number) => (
                      <li key={i}>• {alt.time} ({alt.available} {t("slots")}, {alt.traffic} {t("traffic")})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("selectDriver")}</CardTitle>
            <CardDescription>{t("selectDriverDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{t("selectDriverDesc")}</p>
              <Button onClick={handleAutoAssign} disabled={loading} className="w-full">
                {loading ? t("autoAssigning") : t("autoAssignBestDriver")}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">{t("orManuallySelect")}</span>
              </div>
            </div>

            <div className="space-y-4">
              {availableDrivers.map((driver) => (
                <div key={driver.id} className="flex justify-between items-center p-4 border rounded hover:bg-accent transition-colors">
                  <div>
                    <p className="font-semibold text-foreground">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.vehicle_plate} - {driver.vehicle_type}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                  <Button onClick={() => handleAssign(driver.id)}>{t("assign")}</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import from Permit Database
            </DialogTitle>
            <DialogDescription>
              Fetching shipment data from SMSA logistics system...
            </DialogDescription>
          </DialogHeader>

          {importLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Connecting to database...</p>
              <p className="text-xs text-muted-foreground">Retrieving permit records...</p>
            </div>
          ) : importedData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully fetched 1 record from {importedData.source_system}</span>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Shipment Details</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{importedData.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Container</p>
                    <p className="font-mono text-xs">{importedData.container_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cargo Type</p>
                    <Badge variant="outline">{importedData.cargo_type}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Count</p>
                    <p className="font-medium">{importedData.container_count} containers</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="text-xs">{importedData.pickup_location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="text-xs">{importedData.destination}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preferred Date</p>
                    <p className="text-xs">{importedData.preferred_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preferred Time</p>
                    <p className="text-xs">{importedData.preferred_time}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">{importedData.notes}</p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importLoading}>
              Cancel
            </Button>
            {importedData && (
              <Button onClick={importData}>
                Import Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t("createNewJob")}</CardTitle>
              <CardDescription>{t("createJobDesc")}</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchFromDatabase} type="button" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Import from Database
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("customerName")}</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Customer name (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("containerNumber")}</Label>
                <Input
                  value={formData.container_number}
                  onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("containerCount")}</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.container_count}
                  onChange={(e) => setFormData({ ...formData, container_count: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>{t("cargoType")}</Label>
              <Select
                value={formData.cargo_type}
                onValueChange={(v) => setFormData({ ...formData, cargo_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERISHABLE">{t("PERISHABLE")} ({t("EMERGENCY")})</SelectItem>
                  <SelectItem value="MEDICAL">{t("MEDICAL")} ({t("EMERGENCY")})</SelectItem>
                  <SelectItem value="TIME_SENSITIVE">{t("TIME_SENSITIVE")} ({t("ESSENTIAL")})</SelectItem>
                  <SelectItem value="STANDARD">{t("STANDARD")} ({t("NORMAL")})</SelectItem>
                  <SelectItem value="BULK">{t("BULK")} ({t("LOW")})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("pickupLocation")}</Label>
                <Input
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  placeholder="Pickup location (optional)"
                />
              </div>
              <div>
                <Label>{t("destination")}</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Destination (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("preferredDate")}</Label>
                <Input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  placeholder="Preferred date (optional)"
                />
              </div>
              <div>
                <Label>{t("preferredTime")}</Label>
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
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-3 text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("creating") : t("submitJob")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-8 text-center">Loading...</div>}>
      <CreateJobContent />
    </Suspense>
  );
}
