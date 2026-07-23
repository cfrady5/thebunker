import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { EntityStatusSelect } from "@/components/admin/status-select";
import { formatDateTime } from "@/lib/dates";
import type { EventRow } from "@/types";

export const metadata: Metadata = { title: "Events" };

const STATUS_OPTIONS: Array<[string, string]> = [
  ["draft", "Draft"],
  ["published", "Published"],
  ["cancelled", "Cancelled"],
  ["completed", "Completed"],
];

export default async function AdminEventsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("events").select("*").order("starts_at", { ascending: false })
    : { data: [] };
  const events = (data ?? []) as EventRow[];

  return (
    <div>
      <AdminPageHeader
        title="Events"
        description="Publish events to make them visible on the public calendar; drafts stay internal."
      />
      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No events yet — run the seed script or add events via the database.
        </p>
      ) : (
        <DataTable headers={["Event", "When", "Category", "Status"]}>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-charcoal">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.excerpt}</p>
              </td>
              <td className="px-4 py-3">{formatDateTime(e.starts_at)}</td>
              <td className="px-4 py-3 capitalize">{e.category.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">
                <EntityStatusSelect
                  table="events"
                  id={e.id}
                  current={e.status}
                  options={STATUS_OPTIONS}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
