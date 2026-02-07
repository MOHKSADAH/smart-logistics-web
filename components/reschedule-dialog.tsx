"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
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
import { Calendar, Clock } from "lucide-react";
import { reschedulePermit } from "@/lib/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { TimeSlot } from "@/lib/types";

interface RescheduleDialogProps {
  permitId: string;
  currentSlotDate?: string;
  currentSlotTime?: string;
  availableSlots: TimeSlot[];
}

export function RescheduleDialog({
  permitId,
  currentSlotDate,
  currentSlotTime,
  availableSlots,
}: RescheduleDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const handleReschedule = () => {
    if (!selectedSlotId) {
      toast.error("Please select a time slot");
      return;
    }

    startTransition(async () => {
      const result = await reschedulePermit(permitId, selectedSlotId);
      if (result.success) {
        toast.success("Permit rescheduled successfully");
        setOpen(false);
        setSelectedSlotId(null);
      } else {
        toast.error(`Failed to reschedule: ${result.error}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Calendar className="h-4 w-4 me-1" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Permit</DialogTitle>
          <DialogDescription>
            {currentSlotDate && currentSlotTime ? (
              <>
                Current slot: {format(new Date(currentSlotDate), "MMM d, yyyy")}{" "}
                at {currentSlotTime}. Select a new time slot below.
              </>
            ) : (
              "Select a new time slot for this permit."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {availableSlots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No available slots found
            </p>
          ) : (
            availableSlots.map((slot) => {
              const available = slot.capacity - slot.booked;
              const isSelected = selectedSlotId === slot.id;

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  disabled={isPending}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center p-2 bg-white rounded-md border">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(slot.date), "MMM")}
                        </span>
                        <span className="text-xl font-bold">
                          {format(new Date(slot.date), "d")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(slot.date), "EEE")}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {slot.start_time.slice(0, 5)} -{" "}
                            {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {available} of {slot.capacity} spots available
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {slot.predicted_traffic && (
                        <Badge
                          variant={
                            slot.predicted_traffic === "NORMAL"
                              ? "outline"
                              : slot.predicted_traffic === "MODERATE"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {slot.predicted_traffic}
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge className="bg-blue-500">Selected</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedSlotId || isPending}
          >
            {isPending ? "Rescheduling..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
