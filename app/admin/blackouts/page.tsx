import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import {
  BlackoutDialog,
  DeleteBlackoutButton,
} from "@/components/admin/blackout-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Blackouts" };

interface BlackoutRow {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  blackout_type: string;
  bay: { name: string } | null;
}

export default async function AdminBlackoutsPage() {
  const supabase = await createSupabaseServerClient();
  let blackouts: BlackoutRow[] = [];
  let bays: Array<{ id: string; name: string }> = [];

  if (supabase) {
    const [blackoutsRes, baysRes] = await Promise.all([
      supabase
        .from("bay_blackouts")
        .select("id, starts_at, ends_at, reason, blackout_type, bay:simulator_bays(name)")
        .gte("ends_at", new Date().toISOString())
        .order("starts_at"),
      supabase.from("simulator_bays").select("id, name").order("sort_order"),
    ]);
    blackouts = (blackoutsRes.data ?? []) as unknown as BlackoutRow[];
    bays = baysRes.data ?? [];
  }

  return (
    <div>
      <AdminPageHeader
        title="Blackouts"
        description="Blocked time never shows as available to customers — use it for maintenance, league nights and private events."
        actions={<BlackoutDialog bays={bays} />}
      />
      {blackouts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No upcoming blackouts.
        </p>
      ) : (
        <DataTable headers={["When", "Bay", "Type", "Reason", ""]}>
          {blackouts.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {formatDateTime(b.starts_at)} – {formatTime(b.ends_at)}
              </td>
              <td className="px-4 py-3">{b.bay?.name ?? "All bays"}</td>
              <td className="px-4 py-3">
                <Badge variant="outline">{b.blackout_type.replace(/_/g, " ")}</Badge>
              </td>
              <td className="px-4 py-3">{b.reason ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <DeleteBlackoutButton id={b.id} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
