"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, AlertTriangle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "next/navigation";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { Suspense } from "react";

interface Vessel {
  id: string;
  vessel_name: string;
  arrival_date: string;
  arrival_time: string | null;
  estimated_trucks: number;
}

interface VesselsClientProps {
  vessels: Vessel[];
}

function VesselsContent({ vessels }: VesselsClientProps) {
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  // Calculate congestion level based on estimated trucks
  const getCongestionLevel = (estimatedTrucks: number) => {
    if (estimatedTrucks > 400) return { level: "HIGH", color: "text-red-500 bg-red-50 border-red-200" };
    if (estimatedTrucks > 200) return { level: "MODERATE", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    return { level: "LOW", color: "text-green-600 bg-green-50 border-green-200" };
  };

  // Get recommended time slots
  const getRecommendedSlots = (estimatedTrucks: number) => {
    if (estimatedTrucks > 400) {
      return [t("nightShift"), t("earlyMorning")];
    }
    if (estimatedTrucks > 200) {
      return [t("offPeak"), t("evening")];
    }
    return [t("standardSlots")];
  };

  // Group vessels by date
  const vesselsByDate = vessels.reduce((acc, vessel) => {
    const date = vessel.arrival_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(vessel);
    return acc;
  }, {} as Record<string, Vessel[]>);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t("vesselSchedule")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("vesselScheduleDesc")}
        </p>
      </div>

      {/* Warning Banner */}
      {vessels.some(v => v.estimated_trucks > 400) && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {t("highCongestionExpected")}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {vessels.filter(v => v.estimated_trucks > 400).length} {t("vesselArrivingWith")}{" "}
                  {t("considerBooking")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vessel Schedule Table */}
      {Object.keys(vesselsByDate).length > 0 ? (
        Object.keys(vesselsByDate).map((date) => {
          const dateVessels = vesselsByDate[date];
          return (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
                <span className="text-sm font-normal text-muted-foreground">
                  ({dateVessels.length} {dateVessels.length > 1 ? t("vessels_plural") : t("vessel")})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vesselName")}</TableHead>
                    <TableHead>{t("arrivalTime")}</TableHead>
                    <TableHead className="text-right">{t("estimatedTrucks")}</TableHead>
                    <TableHead>{t("congestionLevel")}</TableHead>
                    <TableHead>{t("recommendedSlots")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dateVessels.map((vessel) => {
                    const congestion = getCongestionLevel(vessel.estimated_trucks);
                    const recommendations = getRecommendedSlots(vessel.estimated_trucks);

                    return (
                      <TableRow key={vessel.id}>
                        <TableCell className="font-medium">
                          {vessel.vessel_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {vessel.arrival_time ? vessel.arrival_time.slice(0, 5) : "TBD"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={vessel.estimated_trucks > 100 ? "font-semibold text-red-600" : ""}>
                            {vessel.estimated_trucks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${congestion.color}`}>
                            {t(congestion.level as any)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {recommendations.map((rec, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Daily Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("totalEstimatedTrucks")} {format(new Date(date), "MMM d")}:
                  </span>
                  <span className="font-semibold">
                    {dateVessels.reduce((sum, v) => sum + v.estimated_trucks, 0)} {t("trucks")}
                  </span>
                </div>
                {dateVessels.reduce((sum, v) => sum + v.estimated_trucks, 0) > 500 && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ {t("expectHeavyCongestion")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noVesselsScheduled")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("aboutVesselImpact")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>{t("whyVesselsMatter")}</strong> {t("whyVesselsMatterDesc")}
          </p>
          <p>
            <strong>{t("portaSolution")}</strong> {t("portaSolutionDesc")}
          </p>
          <p>
            <strong>{t("result")}</strong> {t("resultDesc")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function VesselsClient({ vessels }: VesselsClientProps) {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <VesselsContent vessels={vessels} />
    </Suspense>
  );
}
