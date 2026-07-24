"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setGiftCardStatus } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

export function GiftCardActions({
  id,
  status,
}: {
  id: string;
  status: "pending_payment" | "active" | "depleted" | "disabled";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run(next: "active" | "disabled") {
    startTransition(async () => {
      const res = await setGiftCardStatus(id, next);
      if (!res.ok) window.alert(res.message);
      router.refresh();
    });
  }

  if (status === "depleted") return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex justify-end gap-2">
      {status !== "active" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("active")}>
          Activate
        </Button>
      ) : null}
      {status !== "disabled" ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run("disabled")}>
          Disable
        </Button>
      ) : null}
    </div>
  );
}
