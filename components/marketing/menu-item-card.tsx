import type { MenuItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-conscious": "Gluten-conscious",
  "dairy-free": "Dairy-free",
  "contains-nuts": "Contains nuts",
  spicy: "Spicy",
};

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-surface p-5 transition-shadow hover:shadow-card",
        !item.available && "opacity-60",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg font-semibold text-primary">{item.name}</h3>
        <span className="shrink-0 font-semibold text-charcoal">
          {formatCents(item.price_cents)}
        </span>
      </div>
      {item.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">
          {item.description}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {!item.available ? <Badge variant="outline">Currently unavailable</Badge> : null}
        {item.featured && item.available ? <Badge variant="gold">Featured</Badge> : null}
        {item.dietary_labels.map((label) => (
          <Badge key={label} variant="cream">
            {DIETARY_LABELS[label] ?? label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
