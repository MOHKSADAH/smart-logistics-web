"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban, CheckCircle, XCircle } from "lucide-react";
import { haltPermit, approvePermit, cancelPermit } from "@/lib/actions";
import { toast } from "sonner";
import { RescheduleDialog } from "@/components/reschedule-dialog";
import { TimeSlot } from "@/lib/types";

interface PermitActionsProps {
  permitId: string;
  currentStatus: string;
  priority: string;
  availableSlots: TimeSlot[];
  currentSlotDate?: string;
  currentSlotTime?: string;
}

export function PermitActions({
  permitId,
  currentStatus,
  priority,
  availableSlots,
  currentSlotDate,
  currentSlotTime,
}: PermitActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleAction = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    actionName: string
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(`Permit ${actionName} successfully`);
        setOpenDialog(null);
      } else {
        toast.error(`Failed to ${actionName} permit: ${result.error}`);
      }
    });
  };

  // Don't show halt button for protected priorities
  const canBeHalted =
    !["EMERGENCY", "ESSENTIAL"].includes(priority) &&
    currentStatus === "APPROVED";

  // Show approve button for halted permits
  const canBeApproved = currentStatus === "HALTED";

  // Show reschedule button for halted permits
  const canBeRescheduled = currentStatus === "HALTED";

  // Show cancel for any non-cancelled permit
  const canBeCancelled = !["CANCELLED", "EXPIRED"].includes(currentStatus);

  return (
    <div className="flex gap-2">
      {canBeApproved && (
        <AlertDialog
          open={openDialog === "approve"}
          onOpenChange={(open) => setOpenDialog(open ? "approve" : null)}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 me-1" />
              Approve
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Permit</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve the permit and allow the driver to proceed.
                Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleAction(() => approvePermit(permitId), "approved")
                }
              >
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canBeRescheduled && (
        <RescheduleDialog
          permitId={permitId}
          currentSlotDate={currentSlotDate}
          currentSlotTime={currentSlotTime}
          availableSlots={availableSlots}
        />
      )}

      {canBeHalted && (
        <AlertDialog
          open={openDialog === "halt"}
          onOpenChange={(open) => setOpenDialog(open ? "halt" : null)}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              disabled={isPending}
            >
              <Ban className="h-4 w-4 me-1" />
              Halt
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Halt Permit</AlertDialogTitle>
              <AlertDialogDescription>
                This will halt the permit and notify the driver. They will need
                to reschedule. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleAction(() => haltPermit(permitId), "halted")
                }
                className="bg-orange-600 hover:bg-orange-700"
              >
                Halt Permit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canBeCancelled && (
        <AlertDialog
          open={openDialog === "cancel"}
          onOpenChange={(open) => setOpenDialog(open ? "cancel" : null)}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 me-1" />
              Cancel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Permit</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently cancel the permit. This action cannot be
                undone. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  handleAction(() => cancelPermit(permitId), "cancelled")
                }
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Permit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
