"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setInquiryStatus } from "@/features/admin/actions";
import { Select } from "@/components/ui/select";

const STATUSES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["qualified", "Qualified"],
  ["proposal_sent", "Proposal sent"],
  ["tentative_hold", "Tentative hold"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["lost", "Lost"],
] as const;

export function InquiryStatusSelect({
  inquiryId,
  current,
}: {
  inquiryId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      aria-label="Inquiry status"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        const note = window.prompt("Add an internal note? (optional)") ?? undefined;
        startTransition(async () => {
          const res = await setInquiryStatus(inquiryId, status, note);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
      className="h-9 w-40 text-xs"
    >
      {STATUSES.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
