"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const permitSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  slotId: z.string().min(1, "Time slot is required"),
  cargoType: z.string().min(1, "Cargo type is required"),
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
        toast.success("Permit created successfully");
        setOpen(false);
        reset();
      } else {
        toast.error(`Failed to create permit: ${result.error}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 me-2" />
          Create Permit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Permit</DialogTitle>
          <DialogDescription>
            Manually create a permit for a driver. All fields are required
            except vessel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver *</Label>
            <Select
              onValueChange={(value) => setValue("driverId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
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
            <Label htmlFor="slotId">Time Slot *</Label>
            <Select
              onValueChange={(value) => setValue("slotId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {format(new Date(slot.date), "MMM d, yyyy")} -{" "}
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}{" "}
                    ({slot.capacity - slot.booked} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.slotId && (
              <p className="text-sm text-red-600">{errors.slotId.message}</p>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              onValueChange={(value) =>
                setValue("priority", value as PermitFormData["priority"])
              }
              defaultValue="NORMAL"
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMERGENCY">
                  <div>
                    <div className="font-medium">EMERGENCY</div>
                    <div className="text-xs text-muted-foreground">
                      Medical, perishable goods (cannot be halted)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="ESSENTIAL">
                  <div>
                    <div className="font-medium">ESSENTIAL</div>
                    <div className="text-xs text-muted-foreground">
                      Time-sensitive cargo (cannot be halted)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="NORMAL">
                  <div>
                    <div className="font-medium">NORMAL</div>
                    <div className="text-xs text-muted-foreground">
                      Standard containers (can be rescheduled)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="LOW">
                  <div>
                    <div className="font-medium">LOW</div>
                    <div className="text-xs text-muted-foreground">
                      Bulk materials (flexible timing)
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          {/* Cargo Type */}
          <div className="space-y-2">
            <Label htmlFor="cargoType">Cargo Type *</Label>
            <Select
              onValueChange={(value) => setValue("cargoType", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cargo type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICAL">Medical Supplies</SelectItem>
                <SelectItem value="PERISHABLE">Perishable Goods</SelectItem>
                <SelectItem value="TIME_SENSITIVE">Time-Sensitive</SelectItem>
                <SelectItem value="STANDARD">Standard Container</SelectItem>
                <SelectItem value="BULK">Bulk Materials</SelectItem>
                <SelectItem value="HAZARDOUS">Hazardous Materials</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.cargoType && (
              <p className="text-sm text-red-600">{errors.cargoType.message}</p>
            )}
          </div>

          {/* Vessel Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="vesselId">Vessel (Optional)</Label>
            <Select
              onValueChange={(value) => setValue("vesselId", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="No vessel assigned" />
              </SelectTrigger>
              <SelectContent>
                {vessels.map((vessel) => (
                  <SelectItem key={vessel.id} value={vessel.id}>
                    {vessel.vessel_name} - Arriving{" "}
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Permit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
