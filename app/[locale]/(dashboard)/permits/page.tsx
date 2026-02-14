import { format, formatDistanceToNow } from "date-fns";
import { getTranslations } from 'next-intl/server';
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
import { PermitActions } from "@/components/permit-actions";
import { CreatePermitDialog } from "@/components/create-permit-dialog";
import { PermitDetailDialog } from "@/components/permit-detail-dialog";
import { RealtimeListener } from "@/components/realtime-listener";
import { TruckPlateBadge } from "@/components/truck-plate-badge";
import { OrganizationFilter } from "@/components/organization-filter";
import {
  getAllPermits,
  getAvailableSlots,
  getAllDrivers,
  getVesselSchedules,
} from "@/lib/queries";
import { getServerSupabaseClient } from "@/lib/supabase";

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; organizationId?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations('permits');
  const tCommon = await getTranslations('common');
  const supabase = getServerSupabaseClient();

  // Fetch organizations for filter
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const [permits, availableSlots, drivers, vessels] = await Promise.all([
    getAllPermits({
      status: params.status,
      priority: params.priority,
      organizationId: params.organizationId,
    }),
    getAvailableSlots(15),
    getAllDrivers(),
    getVesselSchedules(),
  ]);

  return (
    <div className="space-y-6">
      {/* Real-time updates */}
      <RealtimeListener table="permits" />
      <RealtimeListener table="time_slots" />

      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PermitFilters />
          <OrganizationFilter organizations={organizations || []} />
        </div>
        <CreatePermitDialog
          drivers={drivers}
          availableSlots={availableSlots}
          vessels={vessels}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('permitId')}</TableHead>
              <TableHead>{t('driver')}</TableHead>
              <TableHead>{t('priority')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('cargoType')}</TableHead>
              <TableHead>{t('timeSlot')}</TableHead>
              <TableHead>{t('created')}</TableHead>
              <TableHead className="text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {t('noPermits')}
                </TableCell>
              </TableRow>
            ) : (
              permits.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell className="font-mono text-xs">
                    {permit.qr_code}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="font-medium">
                        {permit.driver?.name || tCommon('na')}
                      </div>
                      {permit.driver?.vehicle_plate && (
                        <TruckPlateBadge plate={permit.driver.vehicle_plate} />
                      )}
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
                      tCommon('na')
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDistanceToNow(new Date(permit.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PermitDetailDialog permit={permit} />
                      <PermitActions
                        permitId={permit.id}
                        currentStatus={permit.status}
                        priority={permit.priority}
                        availableSlots={availableSlots}
                        currentSlotDate={permit.slot?.date}
                        currentSlotTime={`${permit.slot?.start_time?.slice(0, 5)} - ${permit.slot?.end_time?.slice(0, 5)}`}
                      />
                    </div>
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
