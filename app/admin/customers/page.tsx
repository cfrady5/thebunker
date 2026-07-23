import type { Metadata } from "next";
import Link from "next/link";
import { getCustomers } from "@/features/admin/queries";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatFacility } from "@/lib/dates";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getCustomers(q);

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Search accounts, review history and open customer profiles."
      />

      <form method="get" className="mb-5 flex max-w-md gap-2" role="search">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <Input
          id="customer-search"
          name="q"
          type="search"
          placeholder="Search by name or email"
          defaultValue={q ?? ""}
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {customers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          {q ? `No customers match "${q}".` : "No customer accounts yet."}
        </p>
      ) : (
        <DataTable headers={["Name", "Email", "Phone", "Joined", ""]}>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium text-charcoal">
                {`${c.first_name} ${c.last_name}`.trim() || "—"}
              </td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3">{c.phone ?? "—"}</td>
              <td className="px-4 py-3">
                {formatFacility(c.created_at, "MMM d, yyyy")}
              </td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/customers/${c.id}`}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
