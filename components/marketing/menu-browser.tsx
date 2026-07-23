"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/types";
import { MenuItemCard } from "@/components/marketing/menu-item-card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { cn } from "@/lib/utils";

const DIETARY_FILTERS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-conscious", label: "Gluten-conscious" },
  { value: "dairy-free", label: "Dairy-free" },
];

export function MenuBrowser({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [dietary, setDietary] = React.useState<string[]>([]);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (query) {
      const q = query.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !(item.description ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (dietary.length > 0 && !dietary.every((d) => item.dietary_labels.includes(d))) {
      return false;
    }
    return true;
  });

  const visibleCategories = categories.filter((c) =>
    filtered.some((i) => i.category_id === c.id),
  );

  return (
    <div>
      {/* Sticky category nav + filters */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur lg:top-[72px]">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Menu categories"
        >
          <button
            role="tab"
            aria-selected={activeCategory === null}
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              activeCategory === null
                ? "border-primary bg-primary text-cream"
                : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                activeCategory === cat.id
                  ? "border-primary bg-primary text-cream"
                  : "border-border/60 bg-surface text-charcoal-muted hover:border-primary/40",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search the menu"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary filters">
            {DIETARY_FILTERS.map((f) => {
              const active = dietary.includes(f.value);
              return (
                <button
                  key={f.value}
                  aria-pressed={active}
                  onClick={() =>
                    setDietary((prev) =>
                      active ? prev.filter((d) => d !== f.value) : [...prev, f.value],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    active
                      ? "border-gold bg-gold/15 text-gold-dark"
                      : "border-border/60 bg-surface text-charcoal-muted hover:border-gold/50",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-8 space-y-12">
        {visibleCategories.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            description="Try clearing the search or removing a dietary filter."
          />
        ) : (
          visibleCategories
            .filter((c) => activeCategory === null || c.id === activeCategory)
            .map((category) => {
              const catItems = filtered
                .filter((i) => i.category_id === category.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              return (
                <section key={category.id} aria-labelledby={`menu-${category.slug}`}>
                  <div className="mb-4">
                    <h2
                      id={`menu-${category.slug}`}
                      className="font-serif text-2xl font-semibold text-primary"
                    >
                      {category.name}
                    </h2>
                    {category.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {catItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })
        )}
      </div>
    </div>
  );
}
