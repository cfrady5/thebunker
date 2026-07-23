import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { InlineAlert } from "@/components/feedback/inline-alert";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const rules = settings.booking_rules;

  const rows: Array<[string, string, string]> = [
    ["Minimum session", `${rules.min_duration_minutes} minutes`, "Shortest bookable duration"],
    ["Maximum session", `${rules.max_duration_minutes} minutes`, "Longest bookable duration"],
    ["Slot interval", `${rules.slot_interval_minutes} minutes`, "Start-time granularity"],
    ["Turnaround buffer", `${rules.buffer_minutes} minutes`, "Gap enforced between groups"],
    ["Advance window", `${rules.advance_window_days} days`, "How far ahead customers can book"],
    ["Same-day cutoff", `${rules.same_day_cutoff_minutes} minutes`, "Minimum lead time before a slot"],
    ["Checkout hold", `${rules.hold_minutes} minutes`, "How long a slot is held during payment"],
    ["Cancellation window", `${rules.cancellation_window_hours} hours`, "Full-refund deadline before start"],
    ["Tax rate", `${(rules.tax_rate * 100).toFixed(1)}%`, "Applied to bay time at checkout"],
  ];

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="Booking Settings"
        description="The rules that drive availability, holds and cancellation across the whole booking engine."
      />
      <div className="mb-5">
        <InlineAlert variant="info">
          These values live in the <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">site_settings</code>{" "}
          table under <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">booking_rules</code>. Change them with a
          single SQL update — no deploy needed. An in-dashboard editor is on the
          launch checklist.
        </InlineAlert>
      </div>
      <DataTable headers={["Setting", "Value", "What it does"]}>
        {rows.map(([label, value, hint]) => (
          <tr key={label}>
            <td className="px-4 py-3 font-medium text-charcoal">{label}</td>
            <td className="px-4 py-3">{value}</td>
            <td className="px-4 py-3 text-muted-foreground">{hint}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
