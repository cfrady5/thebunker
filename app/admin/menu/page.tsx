import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { MenuAvailabilityToggle } from "@/components/admin/menu-availability-toggle";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import type { MenuCategory, MenuItem } from "@/types";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const supabase = await createSupabaseServerClient();
  const [catsRes, itemsRes] = supabase
    ? await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("sort_order"),
      ])
    : [{ data: [] }, { data: [] }];

  const categories = (catsRes.data ?? []) as MenuCategory[];
  const items = (itemsRes.data ?? []) as MenuItem[];

  return (
    <div>
      <AdminPageHeader
        title="Menu"
        description="Mark items out of stock when the kitchen runs out — the public menu updates immediately."
      />
      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No menu configured — run the seed script to load the preview menu.
        </p>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id}>
                <h2 className="mb-3 font-serif text-xl font-semibold text-primary">
                  {cat.name}
                </h2>
                <DataTable headers={["Item", "Price", "Labels", "Status", ""]}>
                  {catItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">{formatCents(item.price_cents)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.dietary_labels.map((l) => (
                            <Badge key={l} variant="cream">
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.available ? "success" : "danger"}>
                          {item.available ? "Available" : "Unavailable"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MenuAvailabilityToggle
                          itemId={item.id}
                          available={item.available}
                        />
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
