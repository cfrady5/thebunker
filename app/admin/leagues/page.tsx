import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { EntityStatusSelect } from "@/components/admin/status-select";
import { formatCents } from "@/lib/utils";
import type { League } from "@/types";

export const metadata: Metadata = { title: "Leagues" };

const STATUS_OPTIONS: Array<[string, string]> = [
  ["interest", "Collecting interest"],
  ["opening_soon", "Opening soon"],
  ["open", "Registration open"],
  ["waitlist", "Waitlist"],
  ["full", "Full"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

export default async function AdminLeaguesPage() {
  const supabase = await createSupabaseServerClient();
  const [leaguesRes, regsRes] = supabase
    ? await Promise.all([
        supabase.from("leagues").select("*").order("name"),
        supabase
          .from("league_registrations")
          .select("league_id, status"),
      ])
    : [{ data: [] }, { data: [] }];

  const leagues = (leaguesRes.data ?? []) as League[];
  const regs = (regsRes.data ?? []) as Array<{ league_id: string; status: string }>;

  return (
    <div>
      <AdminPageHeader
        title="Leagues & Tournaments"
        description="Change registration status as seasons open, fill and complete. New leagues can be added via the database until the full editor lands."
      />
      {leagues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No leagues configured — run the seed script to load the planned lineup.
        </p>
      ) : (
        <DataTable headers={["League", "Season", "Price", "Registered", "Status"]}>
          {leagues.map((l) => {
            const count = regs.filter(
              (r) => r.league_id === l.id && r.status !== "cancelled",
            ).length;
            return (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-charcoal">{l.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{l.category}</p>
                </td>
                <td className="px-4 py-3">{l.season ?? "—"}</td>
                <td className="px-4 py-3">
                  {l.price_cents > 0 ? formatCents(l.price_cents) : "TBD"}
                </td>
                <td className="px-4 py-3">
                  {count}
                  {l.capacity ? ` / ${l.capacity}` : ""}
                </td>
                <td className="px-4 py-3">
                  <EntityStatusSelect
                    table="leagues"
                    id={l.id}
                    current={l.status}
                    options={STATUS_OPTIONS}
                  />
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
