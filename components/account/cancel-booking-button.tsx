"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cancelBooking } from "@/features/bookings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function CancelBookingButton({
  bookingId,
  refundEligible,
}: {
  bookingId: string;
  refundEligible: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(
    null,
  );

  function confirm() {
    setResult(null);
    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      setResult(res);
      if (res.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel Reservation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this reservation?</DialogTitle>
          <DialogDescription>
            {refundEligible
              ? "You're outside the cancellation window, so you'll receive a full refund to your original payment method."
              : "You're inside the cancellation window, so the amount paid will be added to your account as credit for a future visit."}
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <InlineAlert variant={result.ok ? "success" : "error"}>
            {result.message}
          </InlineAlert>
        ) : null}
        <DialogFooter>
          {result?.ok ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Keep Reservation
              </Button>
              <Button variant="destructive" onClick={confirm} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" /> Cancelling…
                  </>
                ) : (
                  "Yes, Cancel It"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
