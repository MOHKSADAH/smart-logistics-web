import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { PermitStatusBadge } from "@/components/permit-status-badge";
import { PermitFilters } from "@/components/permit-filters";
import { getAllPermits } from "@/lib/queries";

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const permits = await getAllPermits({
    status: params.status,
    priority: params.priority,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permit Management"
        description="View and manage all truck permits"
      />

      <PermitFilters />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permit ID</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cargo Type</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No permits found
                </TableCell>
              </TableRow>
            ) : (
              permits.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell className="font-mono text-xs">
                    {permit.qr_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {permit.driver?.name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {permit.driver?.vehicle_plate || ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={permit.priority} />
                  </TableCell>
                  <TableCell>
                    <PermitStatusBadge status={permit.status} />
                  </TableCell>
                  <TableCell>{permit.cargo_type}</TableCell>
                  <TableCell>
                    {permit.slot ? (
                      <div className="text-sm">
                        <div>
                          {format(new Date(permit.slot.date), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {permit.slot.start_time.slice(0, 5)} -{" "}
                          {permit.slot.end_time.slice(0, 5)}
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDistanceToNow(new Date(permit.created_at), {
                      addSuffix: true,
                    })}
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
