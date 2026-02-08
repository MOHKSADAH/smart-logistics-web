"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { createPermit } from "@/lib/actions";
import { toast } from "sonner";
import { TimeSlot, VesselSchedule } from "@/lib/types";
import { format } from "date-fns";

// Auto-assign priority based on cargo type
const CARGO_TO_PRIORITY: Record<string, "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW"> = {
  MEDICAL: "EMERGENCY",
  PERISHABLE: "EMERGENCY",
  HAZARDOUS: "EMERGENCY",
  TIME_SENSITIVE: "ESSENTIAL",
  STANDARD: "NORMAL",
  BULK: "LOW",
  OTHER: "NORMAL",
};

// Schema is defined outside component, so validation messages are in English
// Error messages are displayed using translation keys in the component
const permitSchema = z.object({
  driverId: z.string().min(1, "required"),
  slotId: z.string().min(1, "required"),
  cargoType: z.string().min(1, "required"),
  priority: z.enum(["EMERGENCY", "ESSENTIAL", "NORMAL", "LOW"]),
  vesselId: z.string().optional(),
});

type PermitFormData = z.infer<typeof permitSchema>;

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_type: string;
}

interface CreatePermitDialogProps {
  drivers: Driver[];
  availableSlots: TimeSlot[];
  vessels: VesselSchedule[];
}

export function CreatePermitDialog({
  drivers,
  availableSlots,
  vessels,
}: CreatePermitDialogProps) {
  const t = useTranslations('permits');
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PermitFormData>({
    resolver: zodResolver(permitSchema),
    defaultValues: {
      priority: "NORMAL",
    },
  });

  const onSubmit = (data: PermitFormData) => {
    startTransition(async () => {
      const result = await createPermit(data);
      if (result.success) {
        toast.success(t('permitCreatedSuccess'));
        setOpen(false);
        reset();
      } else {
        toast.error(`${t('permitCreatedError')}: ${result.error}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 me-2" />
          {t('create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('createDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driverId">{t('driver')} *</Label>
            <Select
              onValueChange={(value) => setValue("driverId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectDriver')} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.vehicle_plate} ({driver.vehicle_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driverId && (
              <p className="text-sm text-red-600">{errors.driverId.message}</p>
            )}
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="slotId">{t('timeSlot')} *</Label>
            <Select
              onValueChange={(value) => setValue("slotId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectTimeSlot')} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {format(new Date(slot.date), "MMM d, yyyy")} -{" "}
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}{" "}
                    ({slot.capacity - slot.booked} {t('available')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.slotId && (
              <p className="text-sm text-red-600">{errors.slotId.message}</p>
            )}
          </div>

          {/* Cargo Type - Priority is auto-assigned */}
          <div className="space-y-2">
            <Label htmlFor="cargoType">{t('cargoType')} *</Label>
            <Select
              onValueChange={(value) => {
                setValue("cargoType", value);
                // Auto-assign priority based on cargo type
                const priority = CARGO_TO_PRIORITY[value] || "NORMAL";
                setValue("priority", priority);
              }}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectCargoType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICAL">
                  <div>
                    <div className="font-medium">{t('cargoMedical')}</div>
                    <div className="text-xs text-muted-foreground">
                      EMERGENCY - {t('emergencyDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="PERISHABLE">
                  <div>
                    <div className="font-medium">{t('cargoPerishable')}</div>
                    <div className="text-xs text-muted-foreground">
                      EMERGENCY - {t('emergencyDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="HAZARDOUS">
                  <div>
                    <div className="font-medium">{t('cargoHazardous')}</div>
                    <div className="text-xs text-muted-foreground">
                      EMERGENCY - {t('emergencyDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="TIME_SENSITIVE">
                  <div>
                    <div className="font-medium">{t('cargoTimeSensitive')}</div>
                    <div className="text-xs text-muted-foreground">
                      ESSENTIAL - {t('essentialDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="STANDARD">
                  <div>
                    <div className="font-medium">{t('cargoStandard')}</div>
                    <div className="text-xs text-muted-foreground">
                      NORMAL - {t('normalDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="BULK">
                  <div>
                    <div className="font-medium">{t('cargoBulk')}</div>
                    <div className="text-xs text-muted-foreground">
                      LOW - {t('lowDesc')}
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="OTHER">
                  <div>
                    <div className="font-medium">{t('cargoOther')}</div>
                    <div className="text-xs text-muted-foreground">
                      NORMAL - {t('normalDesc')}
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.cargoType && (
              <p className="text-sm text-red-600">{errors.cargoType.message}</p>
            )}
          </div>

          {/* Vessel Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="vesselId">{t('vesselOptional')}</Label>
            <Select
              onValueChange={(value) => setValue("vesselId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('noVesselAssigned')} />
              </SelectTrigger>
              <SelectContent>
                {vessels.map((vessel) => (
                  <SelectItem key={vessel.id} value={vessel.id}>
                    {vessel.vessel_name} - {t('arriving')}{" "}
                    {format(new Date(vessel.arrival_date), "MMM d")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
