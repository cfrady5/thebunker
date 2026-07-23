"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setEntityStatus } from "@/features/admin/actions";
import { Select } from "@/components/ui/select";

/** Inline status changer for leagues, programs and events. */
export function EntityStatusSelect({
  table,
  id,
  current,
  options,
}: {
  table: "leagues" | "programs" | "events";
  id: string;
  current: string;
  options: Array<[value: string, label: string]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      aria-label="Status"
      value={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          const res = await setEntityStatus(table, id, status);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
      className="h-9 w-44 text-xs"
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
