"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setContactMessageStatus } from "@/features/admin/actions";
import { Select } from "@/components/ui/select";

const STATUSES = [
  ["new", "New"],
  ["read", "Read"],
  ["archived", "Archived"],
] as const;

export function ContactMessageStatusSelect({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      aria-label="Message status"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          const res = await setContactMessageStatus(id, status);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
      className="h-9 w-32 text-xs"
    >
      {STATUSES.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
