"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Package,
  User,
  MapPin,
  Calendar,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";

interface JobDetailDialogProps {
  jobId: string;
  jobNumber: string;
  children: React.ReactNode;
}

export function JobDetailDialog({
  jobId,
  jobNumber,
  children,
}: JobDetailDialogProps) {
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  useEffect(() => {
    if (open && !jobData && !error) {
      fetchJobDetails();
    }
  }, [open]);

  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/org/jobs/${jobId}/track`, {
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.job) {
        // Combine job data with driver and permit info
        const combinedData = {
          ...data.job,
          driver: data.driver,
          permit: data.permit,
        };
        setJobData(combinedData);
      } else {
        throw new Error(data.error || "Failed to load job details");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while loading job details";
      console.error("Error fetching job details:", error);
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-blue-600" />
            {t("jobDetails")} -{" "}
            <span className="text-blue-600 font-bold">{jobNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("jobDetails")} {t("track")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="text-red-600 font-semibold mb-2">
              Error Loading Job
            </div>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        ) : jobData ? (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Job Status */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Job Status
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {jobData.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : jobData.status === "ASSIGNED" ? (
                        <Truck className="h-6 w-6 text-blue-600" />
                      ) : jobData.status === "IN_PROGRESS" ? (
                        <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400" />
                      )}
                      <Badge
                        variant={
                          jobData.status === "COMPLETED"
                            ? "default"
                            : jobData.status === "ASSIGNED"
                              ? "secondary"
                              : "outline"
                        }
                        className={`text-base px-5 py-2.5 font-semibold ${
                          jobData.status === "COMPLETED"
                            ? "bg-green-600 hover:bg-green-700"
                            : jobData.status === "ASSIGNED"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : jobData.status === "IN_PROGRESS"
                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                : ""
                        }`}
                      >
                        {t(jobData.status as any)}
                      </Badge>
                    </div>
                  </div>

                  {/* Priority Level */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      {jobData.priority === "EMERGENCY" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Priority Level
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {jobData.priority === "EMERGENCY" ? (
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      ) : jobData.priority === "ESSENTIAL" ? (
                        <Zap className="h-6 w-6 text-orange-600" />
                      ) : jobData.priority === "NORMAL" ? (
                        <Zap className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Zap className="h-6 w-6 text-gray-400" />
                      )}
                      <Badge
                        variant={
                          jobData.priority === "EMERGENCY"
                            ? "destructive"
                            : jobData.priority === "ESSENTIAL"
                              ? "default"
                              : "secondary"
                        }
                        className={`text-base px-5 py-2.5 font-semibold ${
                          jobData.priority === "EMERGENCY"
                            ? "bg-red-600 hover:bg-red-700"
                            : jobData.priority === "ESSENTIAL"
                              ? "bg-orange-600 text-white hover:bg-orange-700"
                              : jobData.priority === "NORMAL"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : ""
                        }`}
                      >
                        {t(jobData.priority as any)} {t("priority")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Cargo Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("customer")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("customerName")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {jobData.customer_name}
                    </p>
                  </div>
                  {jobData.container_number && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        {t("containerNumber")}
                      </p>
                      <p className="font-mono font-semibold text-sm mt-1 text-gray-700">
                        {jobData.container_number}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("containerCount")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {jobData.container_count}{" "}
                      {jobData.container_count === 1
                        ? "Container"
                        : "Containers"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t("cargo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("cargoType")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {t(jobData.cargo_type as any)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("priority")}
                    </p>
                    <Badge
                      variant={
                        jobData.priority === "EMERGENCY"
                          ? "destructive"
                          : jobData.priority === "ESSENTIAL"
                            ? "default"
                            : "secondary"
                      }
                      className="mt-2"
                    >
                      {t(jobData.priority as any)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location & Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("pickupLocation")} & {t("destination")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("pickupLocation")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {jobData.pickup_location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("destination")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {jobData.destination}
                    </p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex items-start gap-3 pt-2">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("preferredDate")} & {t("preferredTime")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {new Date(jobData.preferred_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}{" "}
                      {t("at")} {jobData.preferred_time}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver & Permit Info */}
            {jobData.driver && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {t("assignedDriver")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {t("driverName")}
                    </p>
                    <p className="font-semibold text-base mt-1">
                      {jobData.driver.name}
                    </p>
                  </div>
                  {jobData.driver.phone && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        {t("phone") || "Phone"}
                      </p>
                      <p className="font-semibold text-base mt-1">
                        {jobData.driver.phone}
                      </p>
                    </div>
                  )}
                  {jobData.driver.vehicle_plate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        {t("vehiclePlate")}
                      </p>
                      <p className="font-mono font-bold text-lg text-blue-600 mt-1 tracking-wide">
                        {jobData.driver.vehicle_plate}
                      </p>
                    </div>
                  )}
                  {jobData.permit && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        {t("permitCode")}
                      </p>
                      <p className="font-mono font-bold text-lg text-blue-600 mt-1">
                        {jobData.permit.permit_code}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {jobData.notes && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t("notes")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {jobData.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t("timeline")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <div className="w-0.5 h-12 bg-gray-300"></div>
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Job Created
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(jobData.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}{" "}
                        {new Date(jobData.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {jobData.assigned_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        {jobData.status !== "COMPLETED" && (
                          <div className="w-0.5 h-12 bg-gray-300"></div>
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {jobData.driver
                            ? `Driver Assigned: ${jobData.driver.name}`
                            : "Driver Assigned"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(jobData.assigned_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}{" "}
                          {new Date(jobData.assigned_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {jobData.status === "IN_PROGRESS" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                        <div className="w-0.5 h-12 bg-gray-300"></div>
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          In Progress
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Currently being delivered
                        </p>
                      </div>
                    </div>
                  )}

                  {jobData.completed_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          Completed
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(jobData.completed_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}{" "}
                          {new Date(jobData.completed_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">{t("loading")}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
