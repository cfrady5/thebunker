import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminPageHeader, DataTable } from "@/components/admin/ui";
import { MenuAvailabilityToggle } from "@/components/admin/menu-availability-toggle";
import { MenuItemEditor } from "@/components/admin/menu-item-editor";
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
        description="Add, edit and price items, or mark them out of stock — the public menu updates immediately."
        actions={
          categories.length > 0 ? <MenuItemEditor categories={categories} /> : undefined
        }
      />
      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-surface p-8 text-center text-sm text-muted-foreground">
          No menu categories configured — run the seed script to load the starter
          categories, then add items here.
        </p>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <div key={cat.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold text-primary">
                    {cat.name}
                  </h2>
                  <MenuItemEditor categories={categories} defaultCategoryId={cat.id} />
                </div>
                {catItems.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/60 bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
                    No items in this category yet.
                  </p>
                ) : (
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
                            {item.available ? "Available" : "Out of stock"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <MenuItemEditor categories={categories} item={item} />
                            <MenuAvailabilityToggle
                              itemId={item.id}
                              available={item.available}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
