"use client";

import * as React from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { issueRefund, setBookingStatus } from "@/features/admin/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookingStatus } from "@/types";

export function BookingRowActions({
  bookingId,
  status,
  canRefund,
}: {
  bookingId: string;
  status: BookingStatus;
  canRefund: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) window.alert(res.message);
    });
  }

  const actionable = ["confirmed", "checked_in", "payment_pending"].includes(status);
  if (!actionable && !canRefund) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Booking actions"
        className="rounded-md p-1.5 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        disabled={pending}
      >
        {pending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal aria-hidden className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "confirmed" ? (
          <DropdownMenuItem
            onSelect={() => run(() => setBookingStatus(bookingId, "checked_in"))}
          >
            Check in
          </DropdownMenuItem>
        ) : null}
        {status === "checked_in" ? (
          <DropdownMenuItem
            onSelect={() => run(() => setBookingStatus(bookingId, "completed"))}
          >
            Mark completed
          </DropdownMenuItem>
        ) : null}
        {status === "confirmed" ? (
          <DropdownMenuItem
            onSelect={() => run(() => setBookingStatus(bookingId, "no_show"))}
          >
            Mark no-show
          </DropdownMenuItem>
        ) : null}
        {actionable ? (
          <DropdownMenuItem
            onSelect={() => {
              if (window.confirm("Cancel this booking on the customer's behalf?")) {
                run(() => setBookingStatus(bookingId, "cancelled_by_staff"));
              }
            }}
          >
            Cancel (staff)
          </DropdownMenuItem>
        ) : null}
        {canRefund ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={() => {
                const reason = window.prompt("Refund reason (recorded in the audit log):");
                if (reason !== null) {
                  run(() => issueRefund(bookingId, reason));
                }
              }}
            >
              Issue full refund
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
