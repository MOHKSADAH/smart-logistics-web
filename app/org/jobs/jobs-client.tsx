"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoAssignButton } from "./auto-assign-button";
import { JobDetailDialog } from "./job-detail-dialog";
import { DeleteJobButton } from "./delete-job-button";
import { BulkAutoAssignButton } from "./bulk-auto-assign-button";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { Suspense } from "react";

interface Job {
  id: string;
  job_number: string;
  customer_name: string;
  cargo_type: string;
  priority: string;
  status: string;
  driver?: { name: string; vehicle_plate: string } | null;
  permit?: { permit_code: string; status: string } | null;
}

function JobsContent({ jobs }: { jobs: Job[] }) {
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  const hasPendingJobs = jobs.some((job) => job.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">{t("jobs")}</h2>
        <div className="flex gap-3">
          <BulkAutoAssignButton hasPendingJobs={hasPendingJobs} />
          <Link href={`/org/jobs/create?lang=${locale}`}>
            <Button>{t("createJob")}</Button>
          </Link>
        </div>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>{t("allJobs")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("jobNumber")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("customer")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("cargo")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("priority")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("driver")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("status")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("permit")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-accent transition-colors">
                      <td className="py-4 px-4">
                        <JobDetailDialog jobId={job.id} jobNumber={job.job_number}>
                          <button className="text-primary hover:underline font-medium hover:opacity-80 transition-opacity">
                            {job.job_number}
                          </button>
                        </JobDetailDialog>
                      </td>
                      <td className="py-4 px-4 text-foreground">{job.customer_name}</td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{t(job.cargo_type as any)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            job.priority === "EMERGENCY"
                              ? "destructive"
                              : job.priority === "ESSENTIAL"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {t(job.priority as any)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {job.driver?.name || t("noDriverAssigned")}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            job.status === "COMPLETED"
                              ? "default"
                              : job.status === "ASSIGNED"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {t(job.status as any)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {job.permit?.permit_code || t("noDriverAssigned")}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {job.status === "PENDING" && <AutoAssignButton jobId={job.id} />}
                          <DeleteJobButton jobId={job.id} jobNumber={job.job_number} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      {t("noJobs")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function JobsClient({ jobs }: { jobs: Job[] }) {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <JobsContent jobs={jobs} />
    </Suspense>
  );
}
