"use client";

import { toast } from 'sonner'
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, AlertCircle } from "lucide-react";
import { copyWeek } from "@/lib/actions/meal-plans";
import { format, startOfWeek } from "date-fns";

interface CopyWeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeekStart: Date;
  onSuccess: () => void;
}

export function CopyWeekDialog({
  isOpen,
  onClose,
  currentWeekStart,
  onSuccess,
}: CopyWeekDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    if (!selectedDate) {
      setError("Please select a target week");
      return;
    }

    const targetWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const sourceWeekStr = format(currentWeekStart, "yyyy-MM-dd");
    const targetWeekStr = format(targetWeekStart, "yyyy-MM-dd");

    // Check if trying to copy to same week
    if (sourceWeekStr === targetWeekStr) {
      setError("Cannot copy to the same week");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await copyWeek(sourceWeekStr, targetWeekStr);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Week copied successfully");
        onSuccess();
        onClose();
        setSelectedDate(undefined);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
      setError("");
      setSelectedDate(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Week
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Copy all meals from the week of{" "}
              <strong>
                {format(currentWeekStart, "MMM d")} -{" "}
                {format(
                  new Date(
                    currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
                  ),
                  "MMM d, yyyy"
                )}
              </strong>{" "}
              to another week.
            </p>
            <p className="text-xs text-muted-foreground">
              💡 Great for repeating weekly meal patterns or planning
              ahead!
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Select any day in the target week:
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                // Disable dates in the current week
                const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                return (
                  format(weekStart, "yyyy-MM-dd") ===
                  format(currentWeekStart, "yyyy-MM-dd")
                );
              }}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <Alert>
              <AlertDescription>
                This will copy all meals to the week of{" "}
                <strong>
                  {format(
                    startOfWeek(selectedDate, { weekStartsOn: 1 }),
                    "MMM d"
                  )}{" "}
                  -{" "}
                  {format(
                    new Date(
                      startOfWeek(selectedDate, { weekStartsOn: 1 }).getTime() +
                        6 * 24 * 60 * 60 * 1000
                    ),
                    "MMM d, yyyy"
                  )}
                </strong>
                . Any existing meals in that week will be replaced.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={!selectedDate || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Week
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
