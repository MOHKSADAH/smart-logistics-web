"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { Suspense } from "react";
import {
  Briefcase,
  CheckCircle2,
  Users,
  TruckIcon,
  ArrowRight,
  Package,
  Clock,
  TrendingUp,
} from "lucide-react";

interface RecentJob {
  id: string;
  job_number: string;
  customer_name: string;
  status: string;
}

interface DashboardStats {
  activeJobs: number;
  completedToday: number;
  availableDrivers: number;
  totalDrivers: number;
  recentJobs: RecentJob[];
}

function DashboardContent({ stats }: { stats: DashboardStats }) {
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  // Calculate percentage of available drivers
  const availabilityRate =
    stats.totalDrivers > 0
      ? Math.round((stats.availableDrivers / stats.totalDrivers) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with Welcome Message */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("welcomeBack")}</p>
        </div>
        <Link href={`/org/jobs/create?lang=${locale}`}>
          <Button size="lg" data-tour="create-job-button">
            <Package className="h-4 w-4 me-2" />
            {t("createNewJobCTA")}
          </Button>
        </Link>
      </div>

      {/* Quick Stats Banner */}
      {(stats.activeJobs > 0 || stats.completedToday > 0) && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("todayJobs")}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.activeJobs + stats.completedToday} {t("totalJobs")}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase">
                    {t("activeJobs")}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.activeJobs}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase">
                    {t("completedToday")}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.completedToday}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Enhanced with Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Jobs Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("activeJobs")}
              </CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">
                {stats.activeJobs}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t("status")}: {t("IN_PROGRESS")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("completedToday")}
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">
                {stats.completedToday}
              </p>
              <p className="text-xs text-muted-foreground">
                ✓ {t("COMPLETED")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Available Drivers Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("availableDrivers")}
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">
                {stats.availableDrivers}
              </p>
              <p className="text-xs text-muted-foreground">
                {availabilityRate}% {t("available")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Drivers Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("totalDrivers")}
              </CardTitle>
              <TruckIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-bold text-foreground">
                {stats.totalDrivers}
              </p>
              <p className="text-xs text-muted-foreground">{t("fleetSize")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs - Enhanced Card */}
      <Card className="hover:shadow-lg transition-shadow overflow-hidden" data-tour="recent-jobs">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg font-semibold">
                {t("recentJobs")}
              </CardTitle>
            </div>
            <Badge variant="secondary">
              {stats.recentJobs.length} {t("jobs")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentJobs.length > 0 ? (
            <div className="divide-y">
              {stats.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/org/jobs/${job.id}/track?lang=${locale}`}
                  className="flex justify-between items-center p-4 hover:bg-accent transition-colors group cursor-pointer"
                >
                  <div className="flex-1 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                      <Package className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {job.job_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.customer_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        job.status === "COMPLETED"
                          ? "default"
                          : job.status === "ASSIGNED"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {t(
                        job.status as keyof typeof import("@/lib/org-i18n").orgTranslations.en,
                      )}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">{t("noJobs")}</p>
              <Link href={`/org/jobs/create?lang=${locale}`}>
                <Button className="mt-4" variant="outline">
                  {t("createJob")}
                </Button>
              </Link>
            </div>
          )}
          {stats.recentJobs.length > 0 && (
            <div className="p-4 border-t">
              <Link href={`/org/jobs?lang=${locale}`}>
                <Button variant="ghost" className="w-full">
                  {t("viewAllJobs")}
                  <ArrowRight className="h-4 w-4 ms-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground">Loading...</div>}
    >
      <DashboardContent stats={stats} />
    </Suspense>
  );
}
