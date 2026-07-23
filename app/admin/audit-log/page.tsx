import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Audit Log" };

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  after_data: unknown;
  created_at: string;
  actor: { first_name: string; last_name: string } | null;
}

export default async function AdminAuditLogPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, after_data, created_at, actor:profiles(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };
  const logs = (data ?? []) as unknown as AuditRow[];

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        description="Every staff action that changes money, availability or customer state is recorded here."
      />
      {logs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No audit entries yet.
        </p>
      ) : (
        <DataTable headers={["When", "Who", "Action", "Entity", "Details"]}>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDateTime(log.created_at)}
              </td>
              <td className="px-4 py-3">
                {log.actor
                  ? `${log.actor.first_name} ${log.actor.last_name}`.trim()
                  : "System"}
              </td>
              <td className="px-4 py-3 font-medium text-charcoal">
                {log.action.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {log.entity_type}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground">
                {log.after_data ? JSON.stringify(log.after_data) : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
