import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types";

const LABELS: Record<BookingStatus, { label: string; variant: "success" | "warning" | "danger" | "outline" | "thistle" }> = {
  draft: { label: "Draft", variant: "outline" },
  held: { label: "Held", variant: "warning" },
  payment_pending: { label: "Payment pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  checked_in: { label: "Checked in", variant: "thistle" },
  completed: { label: "Completed", variant: "outline" },
  cancelled_by_customer: { label: "Cancelled", variant: "outline" },
  cancelled_by_staff: { label: "Cancelled by staff", variant: "outline" },
  no_show: { label: "No-show", variant: "danger" },
  refunded: { label: "Refunded", variant: "outline" },
  partially_refunded: { label: "Partially refunded", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = LABELS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
