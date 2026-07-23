import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { EntityStatusSelect } from "@/components/admin/status-select";
import { formatCents } from "@/lib/utils";
import type { Program } from "@/types";

export const metadata: Metadata = { title: "Lessons & Programs" };

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

export default async function AdminProgramsPage() {
  const supabase = await createSupabaseServerClient();
  const [programsRes, regsRes] = supabase
    ? await Promise.all([
        supabase.from("programs").select("*").order("name"),
        supabase.from("program_registrations").select("program_id, status"),
      ])
    : [{ data: [] }, { data: [] }];

  const programs = (programsRes.data ?? []) as Program[];
  const regs = (regsRes.data ?? []) as Array<{ program_id: string; status: string }>;

  return (
    <div>
      <AdminPageHeader
        title="Lessons & Programs"
        description="Private lessons, clinics and youth programs. Update status as registration opens and fills."
      />
      {programs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No programs configured — run the seed script to load the planned lineup.
        </p>
      ) : (
        <DataTable headers={["Program", "Ages", "Price", "Registered", "Status"]}>
          {programs.map((p) => {
            const count = regs.filter(
              (r) => r.program_id === p.id && r.status !== "cancelled",
            ).length;
            return (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-charcoal">{p.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {p.category.replace(/_/g, " ")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {p.age_min !== null && p.age_max !== null
                    ? `${p.age_min}–${p.age_max}`
                    : "All"}
                </td>
                <td className="px-4 py-3">
                  {p.price_cents > 0 ? formatCents(p.price_cents) : "TBD"}
                </td>
                <td className="px-4 py-3">
                  {count}
                  {p.capacity ? ` / ${p.capacity}` : ""}
                </td>
                <td className="px-4 py-3">
                  <EntityStatusSelect
                    table="programs"
                    id={p.id}
                    current={p.status}
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
