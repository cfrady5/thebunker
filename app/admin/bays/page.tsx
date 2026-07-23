import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { BayControls } from "@/components/admin/bay-controls";
import { Badge } from "@/components/ui/badge";
import type { SimulatorBay } from "@/types";

export const metadata: Metadata = { title: "Bays" };

export default async function AdminBaysPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("simulator_bays").select("*").order("sort_order")
    : { data: [] };
  const bays = (data ?? []) as SimulatorBay[];

  return (
    <div>
      <AdminPageHeader
        title="Simulator Bays"
        description="Take bays offline for maintenance or deactivate them entirely. Offline bays never appear in customer availability."
      />
      {bays.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No bays configured. Run the seed script or add bays directly in the
          database.
        </p>
      ) : (
        <DataTable headers={["Bay", "Capacity", "Features", "Status", "Controls"]}>
          {bays.map((bay) => (
            <tr key={bay.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-charcoal">{bay.name}</p>
                <p className="text-xs text-muted-foreground">{bay.description}</p>
              </td>
              <td className="px-4 py-3">{bay.capacity} players</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {bay.accessible ? <Badge variant="thistle">Accessible</Badge> : null}
                  {bay.supports_left_handed ? (
                    <Badge variant="cream">Left-handed</Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    !bay.active
                      ? "outline"
                      : bay.maintenance_status === "operational"
                        ? "success"
                        : "danger"
                  }
                >
                  {!bay.active ? "Inactive" : bay.maintenance_status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <BayControls
                  bayId={bay.id}
                  active={bay.active}
                  maintenanceStatus={bay.maintenance_status}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
