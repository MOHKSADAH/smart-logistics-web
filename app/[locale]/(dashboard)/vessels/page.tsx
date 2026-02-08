import { getTranslations } from "next-intl/server";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { getVesselSchedules, getPriorityRules } from "@/lib/queries";

export default async function VesselsPage() {
  const vessels = await getVesselSchedules();
  const priorityRules = await getPriorityRules();
  const t = await getTranslations("vessels");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "ARRIVED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "DEPARTED":
        return "bg-gray-100 text-gray-600 hover:bg-gray-100";
      case "DELAYED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("vesselName")}</TableHead>
              <TableHead>{t("arrivalDate")}</TableHead>
              <TableHead>{t("time")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("expectedTrucks")}</TableHead>
              <TableHead>{t("actual")}</TableHead>
              <TableHead>{t("cargoType")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vessels.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  {t("noVessels")}
                </TableCell>
              </TableRow>
            ) : (
              vessels.map((vessel) => (
                <TableRow key={vessel.id}>
                  <TableCell className="font-semibold">
                    {vessel.vessel_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(vessel.arrival_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {vessel.arrival_time
                      ? vessel.arrival_time.slice(0, 5)
                      : t("tbd")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vessel.status)}>
                      {vessel.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        vessel.estimated_trucks > 100
                          ? "font-bold text-red-600"
                          : ""
                      }
                    >
                      {vessel.estimated_trucks}
                    </span>
                  </TableCell>
                  <TableCell>{vessel.actual_trucks || "-"}</TableCell>
                  <TableCell>
                    {vessel.cargo_priority ? (
                      <PriorityBadge
                        priority={
                          vessel.cargo_priority as
                            | "EMERGENCY"
                            | "TIME_SENSITIVE"
                            | "ESSENTIAL"
                            | "NORMAL"
                            | "LOW"
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
