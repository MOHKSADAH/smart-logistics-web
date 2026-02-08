"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { PriorityBadge } from "@/components/priority-badge";
import { PermitStatusBadge } from "@/components/permit-status-badge";
import { Separator } from "@/components/ui/separator";
import { TruckPlateBadge } from "@/components/truck-plate-badge";

interface PermitDetailDialogProps {
  permit: {
    id: string;
    qr_code: string;
    status: "APPROVED" | "PENDING" | "HALTED" | "CANCELLED" | "EXPIRED" | "COMPLETED";
    priority: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
    cargo_type: string;
    created_at: string;
    updated_at: string;
    driver?: {
      name: string;
      phone: string;
      vehicle_plate: string;
      vehicle_type: string;
    };
    slot?: {
      date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      booked: number;
    };
    vessel?: {
      vessel_name: string;
      arrival_date: string;
    };
  };
}

export function PermitDetailDialog({ permit }: PermitDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('permitDetail');
  const tCommon = useTranslations('common');
  const tCargo = useTranslations('cargoTypes');

  // Helper to get translated cargo type
  const getCargoTypeLabel = (cargoType: string) => {
    const key = cargoType as keyof IntlMessages['cargoTypes'];
    return tCargo(key) || cargoType;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { qrCode: permit.qr_code })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-lg">
            <QRCodeDisplay value={permit.qr_code} size={200} />
            <p className="text-sm font-mono">{permit.qr_code}</p>
            <div className="flex gap-2">
              <PermitStatusBadge status={permit.status} />
              <PriorityBadge priority={permit.priority} />
            </div>
          </div>

          <Separator />

          {/* Driver Information */}
          <div>
            <h3 className="font-semibold mb-3">{t('driverInfo')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('name')}</p>
                <p className="font-medium">{permit.driver?.name || tCommon('na')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('phone')}</p>
                <p className="font-medium">{permit.driver?.phone || tCommon('na')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('vehiclePlate')}</p>
                <div className="font-medium">
                  {permit.driver?.vehicle_plate ? (
                    <TruckPlateBadge plate={permit.driver.vehicle_plate} />
                  ) : (
                    tCommon('na')
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">{t('vehicleType')}</p>
                <p className="font-medium">
                  {permit.driver?.vehicle_type || tCommon('na')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cargo & Priority */}
          <div>
            <h3 className="font-semibold mb-3">{t('cargoDetails')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('cargoType')}</p>
                <p className="font-medium">{getCargoTypeLabel(permit.cargo_type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('priorityLevel')}</p>
                <PriorityBadge priority={permit.priority} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Time Slot */}
          <div>
            <h3 className="font-semibold mb-3">{t('scheduledSlot')}</h3>
            {permit.slot ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('date')}</p>
                  <p className="font-medium">
                    {format(new Date(permit.slot.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('time')}</p>
                  <p className="font-medium">
                    {permit.slot.start_time.slice(0, 5)} -{" "}
                    {permit.slot.end_time.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('slotCapacity')}</p>
                  <p className="font-medium">
                    {tCommon('trucks')} {permit.slot.booked} / {permit.slot.capacity}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('noSlot')}
              </p>
            )}
          </div>

          {permit.vessel && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">{t('vesselInfo')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('vesselName')}</p>
                    <p className="font-medium">{permit.vessel.vessel_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('arrivalDate')}</p>
                    <p className="font-medium">
                      {format(
                        new Date(permit.vessel.arrival_date),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamps */}
          <div>
            <h3 className="font-semibold mb-3">{t('auditTrail')}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('created')}</p>
                <p className="font-medium">
                  {format(new Date(permit.created_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('lastUpdated')}</p>
                <p className="font-medium">
                  {format(new Date(permit.updated_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
