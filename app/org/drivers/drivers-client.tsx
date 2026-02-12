"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrgTranslation, type Locale } from "@/lib/org-i18n";
import { Suspense } from "react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_type: string;
  has_smartphone: boolean;
  is_available: boolean;
  is_active: boolean;
}

function DriversContent({ drivers }: { drivers: Driver[] }) {
  const searchParams = useSearchParams();
  const locale = (searchParams.get("lang") as Locale) || "en";

  const t = (key: keyof typeof import("@/lib/org-i18n").orgTranslations.en) =>
    getOrgTranslation(locale, key);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">{t("drivers")}</h2>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>{t("fleetOverview")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("name")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("phone")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("vehicle")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("type")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("smartphone")}
                  </th>
                  <th className="pb-3 pt-4 px-4 text-sm font-semibold text-foreground">
                    {t("status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-accent transition-colors">
                      <td className="py-4 px-4 font-semibold text-foreground">
                        {driver.name}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{driver.phone}</td>
                      <td className="py-4 px-4 text-foreground">{driver.vehicle_plate}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{driver.vehicle_type}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        {driver.has_smartphone ? (
                          <span className="text-foreground flex items-center gap-1">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            {t("app")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                            {t("smsOnly")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {driver.is_available ? (
                          <Badge variant="default">
                            {t("available")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t("onJob")}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      {t("allDrivers")} - {t("loading")}
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

export function DriversClient({ drivers }: { drivers: Driver[] }) {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <DriversContent drivers={drivers} />
    </Suspense>
  );
}
