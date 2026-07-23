import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable, MetricCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = { title: "Opening List" };

interface InterestRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  interests: string[];
  email_consent: boolean;
  created_at: string;
}

export default async function AdminEmailPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase
        .from("interest_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };
  const submissions = (data ?? []) as InterestRow[];

  const interestCounts = new Map<string, number>();
  for (const sub of submissions) {
    for (const interest of sub.interests) {
      interestCounts.set(interest, (interestCounts.get(interest) ?? 0) + 1);
    }
  }
  const topInterests = [...interestCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <AdminPageHeader
        title="Opening List"
        description="Everyone who signed up for updates, with their interests. Export to CSV for your email platform."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/api/admin/export/interest">
              <Download aria-hidden /> Export CSV
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total signups" value={String(submissions.length)} />
        <MetricCard
          label="Email consented"
          value={String(submissions.filter((s) => s.email_consent).length)}
        />
        <MetricCard
          label="Top interest"
          value={topInterests[0]?.[0] ?? "—"}
          hint={topInterests[0] ? `${topInterests[0][1]} people` : undefined}
        />
      </div>

      {topInterests.length > 0 ? (
        <div className="mb-6 rounded-lg border border-border/40 bg-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-primary">
            Interest breakdown
          </h2>
          <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {topInterests.map(([interest, count]) => (
              <li key={interest} className="flex justify-between gap-3">
                <span className="text-charcoal-muted">{interest}</span>
                <span className="font-semibold text-charcoal">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No signups yet — share the site and they&apos;ll start rolling in.
        </p>
      ) : (
        <DataTable headers={["Name", "Email", "Interests", "Signed up"]}>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {s.first_name} {s.last_name}
              </td>
              <td className="px-4 py-3">{s.email}</td>
              <td className="max-w-xs px-4 py-3 text-xs text-charcoal-muted">
                {s.interests.join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                {formatFacility(s.created_at, "MMM d, yyyy")}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
