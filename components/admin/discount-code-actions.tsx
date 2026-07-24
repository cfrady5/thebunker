"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { logDiscountUse, setDiscountActive } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

export function DiscountCodeActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const note = window.prompt(
            "Note for this use? (optional — e.g. customer name or booking #)",
          );
          if (note === null) return; // cancelled
          startTransition(async () => {
            const res = await logDiscountUse(id, note || undefined);
            if (!res.ok) window.alert(res.message);
            router.refresh();
          });
        }}
      >
        Log a use
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const res = await setDiscountActive(id, !active);
            if (!res.ok) window.alert(res.message);
            router.refresh();
          });
        }}
      >
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
