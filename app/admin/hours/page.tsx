import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import type { BusinessHoursRow, SpecialHoursRow } from "@/types";

export const metadata: Metadata = { title: "Hours" };

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminHoursPage() {
  const supabase = await createSupabaseServerClient();
  const [hoursRes, specialRes] = supabase
    ? await Promise.all([
        supabase.from("business_hours").select("*").order("day_of_week"),
        supabase
          .from("special_hours")
          .select("*")
          .gte("date", new Date().toISOString().slice(0, 10))
          .order("date"),
      ])
    : [{ data: [] }, { data: [] }];

  const hours = (hoursRes.data ?? []) as BusinessHoursRow[];
  const special = (specialRes.data ?? []) as SpecialHoursRow[];

  return (
    <div>
      <AdminPageHeader
        title="Hours"
        description="Weekly operating hours plus date-specific overrides (holidays, special schedules)."
      />

      <h2 className="mb-3 font-serif text-xl font-semibold text-primary">
        Weekly hours
      </h2>
      <DataTable headers={["Day", "Opens", "Closes", "Status"]}>
        {DAYS.map((day, dow) => {
          const row = hours.find((h) => h.day_of_week === dow);
          return (
            <tr key={day}>
              <td className="px-4 py-3 font-medium text-charcoal">{day}</td>
              <td className="px-4 py-3">{row ? row.opens_at.slice(0, 5) : "—"}</td>
              <td className="px-4 py-3">{row ? row.closes_at.slice(0, 5) : "—"}</td>
              <td className="px-4 py-3">
                <Badge variant={row?.active ? "success" : "outline"}>
                  {row ? (row.active ? "Open" : "Inactive") : "Closed"}
                </Badge>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <h2 className="mb-3 mt-8 font-serif text-xl font-semibold text-primary">
        Upcoming special hours
      </h2>
      {special.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-6 text-center text-sm text-muted-foreground">
          No special hours scheduled. Add holiday hours or closures directly in the
          database, or extend this page with an editor before launch.
        </p>
      ) : (
        <DataTable headers={["Date", "Hours", "Reason"]}>
          {special.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-charcoal">{s.date}</td>
              <td className="px-4 py-3">
                {s.closed
                  ? "Closed"
                  : `${s.opens_at?.slice(0, 5) ?? "—"} – ${s.closes_at?.slice(0, 5) ?? "—"}`}
              </td>
              <td className="px-4 py-3">{s.reason ?? "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
