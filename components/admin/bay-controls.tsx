"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setBayStatus } from "@/features/admin/actions";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function BayControls({
  bayId,
  active,
  maintenanceStatus,
}: {
  bayId: string;
  active: boolean;
  maintenanceStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function update(updates: {
    active?: boolean;
    maintenance_status?: "operational" | "degraded" | "offline";
  }) {
    startTransition(async () => {
      const res = await setBayStatus(bayId, updates);
      if (!res.ok) window.alert(res.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label="Maintenance status"
        value={maintenanceStatus}
        disabled={pending}
        onChange={(e) =>
          update({
            maintenance_status: e.target.value as
              | "operational"
              | "degraded"
              | "offline",
          })
        }
        className="h-9 w-36 text-xs"
      >
        <option value="operational">Operational</option>
        <option value="degraded">Degraded</option>
        <option value="offline">Offline</option>
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => update({ active: !active })}
      >
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
