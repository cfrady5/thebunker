import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata: Metadata = { title: "Team" };

interface StaffRow {
  id: string;
  role: string;
  active: boolean;
  profile: { first_name: string; last_name: string; email: string } | null;
}

export default async function AdminTeamPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("staff_roles")
        .select("id, role, active, profile:profiles(first_name, last_name, email)")
        .order("role")
    : { data: [] };
  const staff = (data ?? []) as unknown as StaffRow[];

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Team"
        description="Staff roles control what each team member can see and do across the dashboard."
      />

      <div className="mb-6">
        <InlineAlert variant="info" title="Granting roles">
          For security, staff roles are granted with the service role key (SQL or a
          trusted script), never from the browser:{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
            insert into staff_roles (profile_id, role) values (…, &apos;front_desk&apos;)
          </code>
          . See ADMIN_GUIDE.md for the exact steps.
        </InlineAlert>
      </div>

      {staff.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No staff roles granted yet. Grant yourself the owner role after your first
          sign-up (see ADMIN_GUIDE.md).
        </p>
      ) : (
        <DataTable headers={["Team member", "Email", "Role", "Status"]}>
          {staff.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {s.profile
                  ? `${s.profile.first_name} ${s.profile.last_name}`.trim()
                  : "—"}
              </td>
              <td className="px-4 py-3">{s.profile?.email}</td>
              <td className="px-4 py-3 capitalize">{s.role.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">
                <Badge variant={s.active ? "success" : "outline"}>
                  {s.active ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
